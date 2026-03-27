// src/utils/badgeEngine.ts
import { db } from "../db";
import {
  badges,
  userBadges,
  userProgress,
  users,
  quizSessions,
  markers,
  islands,
} from "../db/schema";
import { eq, and, gte } from "drizzle-orm";

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
  totalXp: number;
  loginStreak: number;
  markersCompleted: number; // pengganti levelsCompleted + chaptersCompleted
  islandsCompleted: number;
  hasPerfectScore: boolean;
  totalBadgesOwned: number;
}

// ── Build context ────────────────────────────────────────────
const buildContext = async (userId: string): Promise<BadgeContext> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalXp: true, loginStreak: true },
  });

  // Markers yang sudah completed oleh user
  const completedProgress = await db.query.userProgress.findMany({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.isCompleted, true),
    ),
    with: {
      marker: {
        columns: { id: true, islandId: true },
      },
    },
  });

  const markersCompleted = completedProgress.length;

  // Hitung islands completed:
  // Sebuah island dianggap selesai jika semua marker-nya sudah completed
  const islandCompletionMap = new Map<
    string,
    { completed: number; total: number }
  >();

  for (const progress of completedProgress) {
    const islandId = progress.marker.islandId;
    const existing = islandCompletionMap.get(islandId);
    if (existing) {
      existing.completed++;
    } else {
      // Hitung total marker di island ini
      const totalMarkersInIsland = await db.query.markers.findMany({
        where: eq(markers.islandId, islandId),
        columns: { id: true },
      });
      islandCompletionMap.set(islandId, {
        completed: 1,
        total: totalMarkersInIsland.length,
      });
    }
  }

  const islandsCompleted = [...islandCompletionMap.values()].filter(
    (i) => i.completed >= i.total,
  ).length;

  // Perfect score: pernah dapat skor 100
  const perfectSession = await db.query.quizSessions.findFirst({
    where: and(
      eq(quizSessions.userId, userId),
      eq(quizSessions.isCompleted, true),
      gte(quizSessions.score, 100),
    ),
    columns: { id: true },
  });

  // Total badge yang sudah dimiliki
  const ownedBadgesRows = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    columns: { badgeId: true },
  });

  return {
    userId,
    totalXp: user?.totalXp ?? 0,
    loginStreak: user?.loginStreak ?? 0,
    markersCompleted,
    islandsCompleted,
    hasPerfectScore: !!perfectSession,
    totalBadgesOwned: ownedBadgesRows.length,
  };
};

// ── Criteria evaluators ──────────────────────────────────────
type EvaluatorFn = (ctx: BadgeContext, threshold: number) => boolean;

const criteriaEvaluators: Record<string, EvaluatorFn> = {
  // levels_completed & chapters_completed sekarang pakai markersCompleted
  levels_completed: (ctx, val) => ctx.markersCompleted >= val,
  chapters_completed: (ctx, val) => ctx.markersCompleted >= val,
  islands_completed: (ctx, val) => ctx.islandsCompleted >= val,
  perfect_score: (ctx) => ctx.hasPerfectScore,
  total_xp: (ctx, val) => ctx.totalXp >= val,
  badges_collected: (ctx, val) => ctx.totalBadgesOwned >= val,
  login_streak: (ctx, val) => ctx.loginStreak >= val,
};

// ── Main engine ──────────────────────────────────────────────
export const evaluateAndAwardBadges = async (
  userId: string,
): Promise<BadgeResult[]> => {
  const allBadges = await db.query.badges.findMany({
    where: eq(badges.isActive, true),
  });

  const ownedRows = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    columns: { badgeId: true },
  });
  const ownedIds = new Set(ownedRows.map((r) => r.badgeId));

  const ctx = await buildContext(userId);
  const newlyAwarded: BadgeResult[] = [];

  for (const badge of allBadges) {
    if (ownedIds.has(badge.id)) continue;

    const evaluator = criteriaEvaluators[badge.criteriaType];
    if (!evaluator) continue;

    const earned = evaluator(ctx, badge.criteriaValue);
    if (!earned) continue;

    await db.insert(userBadges).values({ userId, badgeId: badge.id });

    if (badge.xpReward > 0) {
      await db
        .update(users)
        .set({ totalXp: ctx.totalXp + badge.xpReward, updatedAt: new Date() })
        .where(eq(users.id, userId));
      ctx.totalXp += badge.xpReward;
    }

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

// ── Upcoming badges (hampir unlock) ─────────────────────────
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

  const currentValues: Record<string, number> = {
    levels_completed: ctx.markersCompleted,
    chapters_completed: ctx.markersCompleted,
    islands_completed: ctx.islandsCompleted,
    total_xp: ctx.totalXp,
    badges_collected: ctx.totalBadgesOwned,
    login_streak: ctx.loginStreak,
    perfect_score: ctx.hasPerfectScore ? 1 : 0,
  };

  const upcoming: Array<
    BadgeResult & { progressPercent: number; progressLabel: string }
  > = [];

  for (const badge of allBadges) {
    if (ownedIds.has(badge.id)) continue;

    const current = currentValues[badge.criteriaType] ?? 0;
    const target = badge.criteriaValue;
    const percent = Math.min(100, Math.floor((current / target) * 100));

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

  return upcoming.sort((a, b) => b.progressPercent - a.progressPercent);
};
