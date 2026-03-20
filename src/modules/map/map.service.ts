// src/modules/map/map.service.ts
import { db } from "../../db";
import { islands, chapters, levels, userProgress } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";

// ── Get all islands + status unlock per user ─────────────────
export const getAllIslands = async (userId: string) => {
  const allIslands = await db.query.islands.findMany({
    orderBy: (islands, { asc }) => [asc(islands.orderIndex)],
    with: {
      chapters: {
        columns: { id: true },
      },
    },
  });

  // calculate progress per island for this user
  const result = await Promise.all(
    allIslands.map(async (island) => {
      const chapterIds = island.chapters.map((c) => c.id);

      // if island !chapter, return 0
      if (!chapterIds.length) {
        return {
          id: island.id,
          name: island.name,
          slug: island.slug,
          description: island.description,
          mapLat: island.mapLat,
          mapLng: island.mapLng,
          imageUrl: island.imageUrl,
          isDefaultUnlocked: island.isDefaultUnlocked,
          orderIndex: island.orderIndex,
          chaptersCount: 0,
          userProgress: { completedLevels: 0, totalLevels: 0 },
        };
      }

      // total levels in this island
      const allLevels = await db.query.levels.findMany({
        where: inArray(levels.chapterId, chapterIds),
        columns: { id: true },
      });

      // completed levels user in this island
      const levelIds = allLevels.map((l) => l.id);
      const completedLevels = levelIds.length
        ? await db.query.userProgress.findMany({
            where: and(
              eq(userProgress.userId, userId),
              eq(userProgress.isCompleted, true),
              inArray(userProgress.levelId, levelIds),
            ),
            columns: { id: true },
          })
        : [];

      return {
        id: island.id,
        name: island.name,
        slug: island.slug,
        description: island.description,
        mapLat: island.mapLat,
        mapLng: island.mapLng,
        imageUrl: island.imageUrl,
        isDefaultUnlocked: island.isDefaultUnlocked,
        orderIndex: island.orderIndex,
        chaptersCount: island.chapters.length,
        userProgress: {
          completedLevels: completedLevels.length,
          totalLevels: allLevels.length,
        },
      };
    }),
  );

  return result;
};

// ── Get detail island + chapters ─────────────────────────────
export const getIslandById = async (islandId: string, userId: string) => {
  const island = await db.query.islands.findFirst({
    where: eq(islands.id, islandId),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.orderIndex)],
      },
    },
  });

  if (!island) throw new Error("ISLAND_NOT_FOUND");
  return island;
};

// ── Get chapters in an island + status level ──────────
export const getChaptersByIsland = async (islandId: string, userId: string) => {
  const island = await db.query.islands.findFirst({
    where: eq(islands.id, islandId),
    columns: { id: true, name: true },
  });
  if (!island) throw new Error("ISLAND_NOT_FOUND");

  const allChapters = await db.query.chapters.findMany({
    where: eq(chapters.islandId, islandId),
    orderBy: (chapters, { asc }) => [asc(chapters.orderIndex)],
    with: {
      levels: {
        orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
      },
    },
  });

  // combine with user progress
  const result = await Promise.all(
    allChapters.map(async (chapter) => {
      const levelsWithProgress = await Promise.all(
        chapter.levels.map(async (level) => {
          const progress = await db.query.userProgress.findFirst({
            where: and(
              eq(userProgress.userId, userId),
              eq(userProgress.levelId, level.id),
            ),
          });

          return {
            id: level.id,
            levelNumber: level.levelNumber,
            title: level.title,
            eraPeriod: level.eraPeriod,
            xpReward: level.xpReward,
            isUnlocked: progress?.isUnlocked ?? level.levelNumber === 1,
            isCompleted: progress?.isCompleted ?? false,
            bestScore: progress?.bestScore ?? 0,
            attempts: progress?.attempts ?? 0,
          };
        }),
      );

      return {
        id: chapter.id,
        name: chapter.name,
        regionName: chapter.regionName,
        description: chapter.description,
        pointLat: chapter.pointLat,
        pointLng: chapter.pointLng,
        imageUrl: chapter.imageUrl,
        orderIndex: chapter.orderIndex,
        levels: levelsWithProgress,
      };
    }),
  );

  return result;
};

// ── Get detail one level ────────────────────────────────────
export const getLevelById = async (levelId: string, userId: string) => {
  const level = await db.query.levels.findFirst({
    where: eq(levels.id, levelId),
    with: {
      chapter: {
        with: { island: true },
      },
    },
  });

  if (!level) throw new Error("LEVEL_NOT_FOUND");

  const progress = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.levelId, levelId),
    ),
  });

  return {
    ...level,
    userProgress: progress ?? null,
  };
};
