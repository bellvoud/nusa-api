// src/modules/map/map.service.ts
import { db } from "../../db";
import { islands, markers, quizzes, userProgress } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";

// ── Get all islands + progress user ─────────────────────────
export const getAllIslands = async (userId: string) => {
  const allIslands = await db.query.islands.findMany({
    orderBy: (islands, { asc }) => [asc(islands.orderIndex)],
    with: {
      markers: {
        columns: { id: true },
      },
    },
  });

  const result = await Promise.all(
    allIslands.map(async (island) => {
      const markerIds = island.markers.map((m) => m.id);

      if (!markerIds.length) {
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
          markersCount: 0,
          userProgress: { completedMarkers: 0, totalMarkers: 0 },
        };
      }

      // Hitung marker yang sudah completed oleh user
      // user_progress sekarang track per marker (bukan per level)
      const completedProgress = markerIds.length
        ? await db.query.userProgress.findMany({
            where: and(
              eq(userProgress.userId, userId),
              eq(userProgress.isCompleted, true),
              inArray(userProgress.markerId, markerIds),
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
        markersCount: markerIds.length,
        userProgress: {
          completedMarkers: completedProgress.length,
          totalMarkers: markerIds.length,
        },
      };
    }),
  );

  return result;
};

// ── Get all markers in an island + unlock status ─────────────
export const getMarkersByIsland = async (islandId: string, userId: string) => {
  const island = await db.query.islands.findFirst({
    where: eq(islands.id, islandId),
    columns: { id: true, name: true },
  });
  if (!island) throw new Error("ISLAND_NOT_FOUND");

  const allMarkers = await db.query.markers.findMany({
    where: eq(markers.islandId, islandId),
    orderBy: (markers, { asc }) => [asc(markers.orderIndex)],
  });

  // Gabungkan dengan user_progress untuk status unlock tiap marker
  const result = await Promise.all(
    allMarkers.map(async (marker) => {
      const progress = await db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, userId),
          eq(userProgress.markerId, marker.id),
        ),
      });

      return {
        id: marker.id,
        islandId: marker.islandId,
        name: marker.name,
        slug: marker.slug,
        posTop: marker.posTop,
        posLeft: marker.posLeft,
        xpReward: marker.xpReward,
        xpRequired: marker.xpRequired,
        totalSoal: marker.totalSoal,
        wilayah: marker.wilayah,
        imageUrl: marker.imageUrl,
        deskripsi: marker.deskripsi,
        thumbnail: marker.thumbnail,
        // Unlock jika xpRequired = 0 atau user sudah punya cukup XP
        isUnlocked: progress?.isUnlocked ?? marker.xpRequired === 0,
        isCompleted: progress?.isCompleted ?? false,
        bestScore: progress?.bestScore ?? 0,
        attempts: progress?.attempts ?? 0,
      };
    }),
  );

  return result;
};

// ── Get detail satu marker + quizzes ────────────────────────
export const getMarkerById = async (markerId: string, userId: string) => {
  const marker = await db.query.markers.findFirst({
    where: eq(markers.id, markerId),
    with: {
      island: true,
      quizzes: {
        orderBy: (quizzes, { asc }) => [asc(quizzes.orderIndex)],
        with: {
          options: {
            columns: {
              id: true,
              optionText: true,
              orderIndex: true,
              // isCorrect sengaja tidak diambil — hanya untuk submit
            },
            orderBy: (o, { asc }) => [asc(o.orderIndex)],
          },
        },
      },
    },
  });

  if (!marker) throw new Error("MARKER_NOT_FOUND");

  const progress = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.markerId, markerId),
    ),
  });

  return {
    ...marker,
    userProgress: progress ?? null,
  };
};
