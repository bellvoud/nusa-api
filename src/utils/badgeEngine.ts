// src/utils/badgeEngine.ts
// badge criteria engine — automatic badge checking and awarding based on gameplay conditions

import { db } from "../db";
import {
  badges,
  userBadges,
  userProgress,
  users,
  quizSessions,
  islands,
  chapters,
  levels,
} from "../db/schema";
import { eq, and, count, gte } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────

export interface BadgeResult {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  xpReward: number;
}

interface BadgeContext {
  userId: string;
  // data need by various criteria checkers
  totalXp: number;
  loginStreak: number;
  levelsCompleted: number;
  chaptersCompleted: number;
  islandsCompleted: number;
  hasPerfectScore: boolean;
  totalBadgesOwned: number;
}

// ── build context from db (one query per evaluation) ────
const buildContext = async (userId: string): Promise<BadgeContext> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalXp: true, loginStreak: true },
  });

  // levels completed
  const completedLevelsRows = await db.query.userProgress.findMany({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.isCompleted, true),
    ),
    with: {
      level: {
        with: { chapter: { with: { island: true } } },
      },
    },
  });

  // chapters completed: must complete all levels in a chapter
  const chapterProgressMap = new Map<
    string,
    { completed: number; total: number; islandId: string }
  >();

  for (const progress of completedLevelsRows) {
    const chapterId = progress.level.chapterId;
    const islandId = progress.level.chapter.islandId;
    const existing = chapterProgressMap.get(chapterId);
    if (existing) {
      existing.completed++;
    } else {
      // get total level in this chapter
      const totalLevelsInChapter = await db.query.levels.findMany({
        where: eq(levels.chapterId, chapterId),
        columns: { id: true },
      });
      chapterProgressMap.set(chapterId, {
        completed: 1,
        total: totalLevelsInChapter.length,
        islandId,
      });
    }
  }

  const chaptersCompleted = [...chapterProgressMap.values()].filter(
    (c) => c.completed >= c.total,
  ).length;

  // islands completed: must complete all chapters in an island
  const islandProgressMap = new Map<
    string,
    { completedChapters: number; totalChapters: number }
  >();

  for (const [, chapterData] of chapterProgressMap.entries()) {
    if (chapterData.completed < chapterData.total) continue;
    const islandId = chapterData.islandId;
    const existing = islandProgressMap.get(islandId);
    if (existing) {
      existing.completedChapters++;
    } else {
      const totalChaptersInIsland = await db.query.chapters.findMany({
        where: eq(chapters.islandId, islandId),
        columns: { id: true },
      });
      islandProgressMap.set(islandId, {
        completedChapters: 1,
        totalChapters: totalChaptersInIsland.length,
      });
    }
  }

  const islandsCompleted = [...islandProgressMap.values()].filter(
    (i) => i.completedChapters >= i.totalChapters,
  ).length;

  // perfect score: ever got 100 score
  const perfectSession = await db.query.quizSessions.findFirst({
    where: and(
      eq(quizSessions.userId, userId),
      eq(quizSessions.isCompleted, true),
      gte(quizSessions.score, 100),
    ),
    columns: { id: true },
  });

  // total owned badges
  const ownedBadgesRows = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    columns: { badgeId: true },
  });

  return {
    userId,
    totalXp: user?.totalXp ?? 0,
    loginStreak: user?.loginStreak ?? 0,
    levelsCompleted: completedLevelsRows.length,
    chaptersCompleted,
    islandsCompleted,
    hasPerfectScore: !!perfectSession,
    totalBadgesOwned: ownedBadgesRows.length,
  };
};

// ── Criteria evaluators ──────────────────────────────────────
// each criteria_type has its own evaluator function
// to add new criteria, just add an entry in this map

type EvaluatorFn = (ctx: BadgeContext, threshold: number) => boolean;

const criteriaEvaluators: Record<string, EvaluatorFn> = {
  levels_completed: (ctx, val) => ctx.levelsCompleted >= val,
  chapters_completed: (ctx, val) => ctx.chaptersCompleted >= val,
  islands_completed: (ctx, val) => ctx.islandsCompleted >= val,
  perfect_score: (ctx) => ctx.hasPerfectScore,
  total_xp: (ctx, val) => ctx.totalXp >= val,
  badges_collected: (ctx, val) => ctx.totalBadgesOwned >= val,
  login_streak: (ctx, val) => ctx.loginStreak >= val,
};

// ── main engine ─────────────────────────────────────────────
export const evaluateAndAwardBadges = async (
  userId: string,
): Promise<BadgeResult[]> => {
  // get all active badges
  const allBadges = await db.query.badges.findMany({
    where: eq(badges.isActive, true),
  });

  // owned badges
  const ownedRows = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    columns: { badgeId: true },
  });
  const ownedIds = new Set(ownedRows.map((r) => r.badgeId));

  // build context once for all evaluations
  const ctx = await buildContext(userId);

  const newlyAwarded: BadgeResult[] = [];

  for (const badge of allBadges) {
    // skip owned badges
    if (ownedIds.has(badge.id)) continue;

    const evaluator = criteriaEvaluators[badge.criteriaType];
    if (!evaluator) continue;

    const earned = evaluator(ctx, badge.criteriaValue);
    if (!earned) continue;

    // insert badge to user
    await db.insert(userBadges).values({
      userId,
      badgeId: badge.id,
    });

    // add badge xp reward to user
    if (badge.xpReward > 0) {
      await db
        .update(users)
        .set({
          totalXp: ctx.totalXp + badge.xpReward,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // update context so next badge
      // that has total_xp criteria can be counted
      ctx.totalXp += badge.xpReward;
    }

    // update owned badges count in context (for badges_collected criteria)
    ctx.totalBadgesOwned++;

    newlyAwarded.push({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      xpReward: badge.xpReward,
    });
  }

  return newlyAwarded;
};

// ── Helper: cek preview badge yang hampir unlock ─────────────
// useful for "upcoming badges" UI
export const getUpcomingBadges = async (
  userId: string,
): Promise<
  Array<BadgeResult & { progressPercent: number; progressLabel: string }>
> => {
  const allBadges = await db.query.badges.findMany({
    where: eq(badges.isActive, true),
  });

  const ownedRows = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    columns: { badgeId: true },
  });
  const ownedIds = new Set(ownedRows.map((r) => r.badgeId));

  const ctx = await buildContext(userId);

  const upcoming: Array<
    BadgeResult & { progressPercent: number; progressLabel: string }
  > = [];

  const currentValues: Record<string, number> = {
    levels_completed: ctx.levelsCompleted,
    chapters_completed: ctx.chaptersCompleted,
    islands_completed: ctx.islandsCompleted,
    total_xp: ctx.totalXp,
    badges_collected: ctx.totalBadgesOwned,
    login_streak: ctx.loginStreak,
    perfect_score: ctx.hasPerfectScore ? 1 : 0,
  };

  for (const badge of allBadges) {
    if (ownedIds.has(badge.id)) continue;

    const current = currentValues[badge.criteriaType] ?? 0;
    const target = badge.criteriaValue;
    const percent = Math.min(100, Math.floor((current / target) * 100));

    // show only badges that already progress > 0 or almost unlock (>= 50%)
    if (percent === 0) continue;

    upcoming.push({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      xpReward: badge.xpReward,
      progressPercent: percent,
      progressLabel: `${current} / ${target}`,
    });
  }

  // sort from the closest to finish
  return upcoming.sort((a, b) => b.progressPercent - a.progressPercent);
};
