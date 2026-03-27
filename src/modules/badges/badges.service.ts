// src/modules/badges/badges.service.ts
import { db } from "../../db";
import {
  badges,
  userBadges,
  userProgress,
  users,
  markers,
  islands,
} from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  levelProgress,
  xpInCurrentLevel,
  xpToNextLevel,
  calculateLevel,
} from "../../utils/xp";

// ── Semua badge milik user ───────────────────────────────────
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

// ── Katalog semua badge + status kepemilikan ─────────────────
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

  return { ...badge, isOwned: !!owned, earnedAt: owned?.earnedAt ?? null };
};

// ── Progress lengkap user ────────────────────────────────────
// Sebelumnya pakai level→chapter→island, sekarang pakai marker→island
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

  // Progress per marker
  const allProgress = await db.query.userProgress.findMany({
    where: eq(userProgress.userId, userId),
    with: {
      marker: {
        columns: { id: true, name: true, islandId: true, wilayah: true },
        with: {
          island: {
            columns: { id: true, name: true },
          },
        },
      },
    },
  });

  const completedCount = allProgress.filter((p) => p.isCompleted).length;
  const unlockedCount = allProgress.filter((p) => p.isUnlocked).length;
  const totalAttempts = allProgress.reduce((sum, p) => sum + p.attempts, 0);

  // Hitung island yang sudah dijelajahi (ada minimal 1 marker completed)
  const exploredIslands = new Set(
    allProgress.filter((p) => p.isCompleted).map((p) => p.marker.islandId),
  ).size;

  return {
    user: {
      ...user,
      xpInCurrentLevel: xpInCurrentLevel(user.totalXp),
      xpToNextLevel: xpToNextLevel(user.level),
      levelProgressPercent: levelProgress(user.totalXp),
    },
    stats: {
      markersCompleted: completedCount,
      markersUnlocked: unlockedCount,
      islandsExplored: exploredIslands,
      totalAttempts,
      // Untuk kompatibilitas dengan badgeConfig.js di frontend
      totalXP: user.totalXp,
      questSelesai: completedCount,
      pulauDijelajahi: exploredIslands,
      menitBermain: 0, // tidak ditrack, default 0
      questPerfect: 0, // bisa dihitung dari quiz_sessions jika diperlukan
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

  return { leaderboard: ranked, currentUserRank };
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

  const completedMarkers = await db.query.userProgress.findMany({
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
      markersCompleted: completedMarkers.length,
    },
  };
};
