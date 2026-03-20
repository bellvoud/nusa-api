// src/modules/badges/badges.service.ts
import { db } from "../../db";
import { badges, userBadges, userProgress, users } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  levelProgress,
  xpInCurrentLevel,
  xpToNextLevel,
  calculateLevel,
} from "../../utils/xp";

// ── Semua badge yang dimiliki user ───────────────────────────
export const getUserBadges = async (userId: string) => {
  const owned = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    with: { badge: true },
    orderBy: (ub, { desc }) => [desc(ub.earnedAt)],
  });

  return {
    totalBadges: owned.length,
    badges: owned.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
      category: ub.badge.category,
      xpReward: ub.badge.xpReward,
      earnedAt: ub.earnedAt,
    })),
  };
};

// ── Katalog semua badge (termasuk yang belum dimiliki) ───────
export const getAllBadges = async (userId: string) => {
  const allBadges = await db.query.badges.findMany({
    where: eq(badges.isActive, true),
    orderBy: (b, { asc }) => [asc(b.category), asc(b.criteriaValue)],
  });

  const ownedBadges = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    columns: { badgeId: true, earnedAt: true },
  });
  const ownedMap = new Map(ownedBadges.map((b) => [b.badgeId, b.earnedAt]));

  return allBadges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    category: badge.category,
    criteriaType: badge.criteriaType,
    criteriaValue: badge.criteriaValue,
    xpReward: badge.xpReward,
    isOwned: ownedMap.has(badge.id),
    earnedAt: ownedMap.get(badge.id) ?? null,
  }));
};

// ── Detail satu badge ────────────────────────────────────────
export const getBadgeById = async (badgeId: string, userId: string) => {
  const badge = await db.query.badges.findFirst({
    where: eq(badges.id, badgeId),
  });
  if (!badge) throw new Error("BADGE_NOT_FOUND");

  const owned = await db.query.userBadges.findFirst({
    where: and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)),
  });

  return {
    ...badge,
    isOwned: !!owned,
    earnedAt: owned?.earnedAt ?? null,
  };
};

// ── Progress lengkap user (semua island & level) ─────────────
export const getUserFullProgress = async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      totalXp: true,
      level: true,
      loginStreak: true,
    },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const allProgress = await db.query.userProgress.findMany({
    where: eq(userProgress.userId, userId),
    with: {
      level: {
        with: {
          chapter: {
            with: { island: true },
          },
        },
      },
    },
  });

  const completedCount = allProgress.filter((p) => p.isCompleted).length;

  return {
    user: {
      ...user,
      xpInCurrentLevel: xpInCurrentLevel(user.totalXp),
      xpToNextLevel: xpToNextLevel(user.level),
      levelProgressPercent: levelProgress(user.totalXp),
    },
    stats: {
      levelsCompleted: completedCount,
      levelsUnlocked: allProgress.filter((p) => p.isUnlocked).length,
      totalAttempts: allProgress.reduce((sum, p) => sum + p.attempts, 0),
    },
    progress: allProgress,
  };
};

// ── Leaderboard top 50 ───────────────────────────────────────
export const getLeaderboard = async (userId: string) => {
  const topUsers = await db.query.users.findMany({
    orderBy: (u, { desc }) => [desc(u.totalXp)],
    limit: 50,
    columns: {
      id: true,
      username: true,
      avatarUrl: true,
      totalXp: true,
      level: true,
    },
  });

  const ranked = topUsers.map((user, index) => ({
    rank: index + 1,
    ...user,
    isCurrentUser: user.id === userId,
  }));

  // Jika user tidak masuk top 50, cari posisinya secara terpisah
  let currentUserRank = ranked.find((u) => u.isCurrentUser) ?? null;

  if (!currentUserRank) {
    const allUsers = await db.query.users.findMany({
      orderBy: (u, { desc }) => [desc(u.totalXp)],
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
        totalXp: true,
        level: true,
      },
    });
    const position = allUsers.findIndex((u) => u.id === userId);
    if (position !== -1) {
      currentUserRank = {
        rank: position + 1,
        ...allUsers[position],
        isCurrentUser: true,
      };
    }
  }

  return {
    leaderboard: ranked,
    currentUserRank,
  };
};

// ── Profil publik user lain ──────────────────────────────────
export const getPublicProfile = async (targetUserId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    columns: {
      id: true,
      username: true,
      avatarUrl: true,
      totalXp: true,
      level: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const badgeCount = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, targetUserId),
    columns: { id: true },
  });

  const completedLevels = await db.query.userProgress.findMany({
    where: and(
      eq(userProgress.userId, targetUserId),
      eq(userProgress.isCompleted, true),
    ),
    columns: { id: true },
  });

  return {
    ...user,
    stats: {
      badgesEarned: badgeCount.length,
      levelsCompleted: completedLevels.length,
    },
  };
};
