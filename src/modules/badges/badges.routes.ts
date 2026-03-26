// src/modules/badges/badges.routes.ts
import { Elysia, t } from "elysia";
import { authMiddleware } from "../auth/auth.routes";
import {
  getUserBadges,
  getAllBadges,
  getBadgeById,
  getUserFullProgress,
  getLeaderboard,
  getPublicProfile,
} from "./badges.service";
import { getUpcomingBadges } from "../../utils/badgeEngine";
import { ok, fail } from "../../utils/response";

export const badgesRoutes = new Elysia()
  .use(authMiddleware)

  // GET /badges — katalog semua badge
  .get(
    "/badges",
    async ({ userId, set }) => {
      try {
        const data = await getAllBadges(userId);
        return ok(data);
      } catch (e: any) {
        console.error("[badges]", e?.message, e?.stack);
        set.status = 500;
        return fail("Gagal mengambil data badge");
      }
    },
    {
      detail: {
        tags: ["Badges"],
        summary: "Katalog semua badge beserta status kepemilikan user",
      },
    },
  )

  // GET /badges/:id — detail satu badge
  .get(
    "/badges/:id",
    async ({ userId, params, set }) => {
      try {
        const data = await getBadgeById(params.id, userId);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("Badge tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Badges"], summary: "Detail satu badge" },
    },
  )

  // GET /users/me/badges — badge milik user yang login
  .get(
    "/users/me/badges",
    async ({ userId, set }) => {
      try {
        const data = await getUserBadges(userId);
        return ok(data);
      } catch (e: any) {
        console.error("[users/me/badges]", e?.message, e?.stack);
        set.status = 500;
        return fail("Gagal mengambil badge user");
      }
    },
    {
      detail: { tags: ["Badges"], summary: "Semua badge yang dimiliki user" },
    },
  )

  // GET /users/me/badges/upcoming — badge yang hampir unlock
  .get(
    "/users/me/badges/upcoming",
    async ({ userId, set }) => {
      try {
        const data = await getUpcomingBadges(userId);
        return ok(data);
      } catch (e: any) {
        console.error("[upcoming badges]", e?.message, e?.stack);
        set.status = 500;
        return fail("Gagal mengambil upcoming badges");
      }
    },
    {
      detail: {
        tags: ["Badges"],
        summary: "Badge yang hampir unlock beserta persentase progress",
      },
    },
  )

  // GET /users/me/progress — progress lengkap user
  .get(
    "/users/me/progress",
    async ({ userId, set }) => {
      try {
        const data = await getUserFullProgress(userId);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("User tidak ditemukan");
      }
    },
    {
      detail: {
        tags: ["Badges"],
        summary: "Progress lengkap user: XP, level, semua island & chapter",
      },
    },
  )

  // GET /leaderboard — top 50 pemain
  .get(
    "/leaderboard",
    async ({ userId, set }) => {
      try {
        const data = await getLeaderboard(userId);
        return ok(data);
      } catch {
        set.status = 500;
        return fail("Gagal mengambil leaderboard");
      }
    },
    {
      detail: {
        tags: ["Badges"],
        summary: "Top 50 pemain berdasarkan total XP",
      },
    },
  )

  // GET /users/:id/profile — profil publik user lain
  .get(
    "/users/:id/profile",
    async ({ params, set }) => {
      try {
        const data = await getPublicProfile(params.id);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("User tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Badges"], summary: "Profil publik user lain" },
    },
  );
