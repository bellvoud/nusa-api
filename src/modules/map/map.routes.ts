// src/modules/map/map.routes.ts
import { Elysia, t } from "elysia";
import { authMiddleware } from "../auth/auth.routes";
import {
  getAllIslands,
  getIslandById,
  getChaptersByIsland,
  getLevelById,
} from "./map.service";
import { ok, fail } from "../../utils/response";

export const mapRoutes = new Elysia({ prefix: "/map" })
  .use(authMiddleware)

  // GET /map/islands
  .get(
    "/islands",
    async ({ userId, set }) => {
      try {
        const data = await getAllIslands(userId);
        return ok(data);
      } catch (e: any) {
        console.error("[map/islands]", e?.message, e?.stack);
        set.status = 500;
        return fail("Gagal mengambil data pulau");
      }
    },
    {
      detail: {
        tags: ["Map"],
        summary: "Daftar semua pulau beserta progress user",
      },
    },
  )

  // GET /map/islands/:id
  .get(
    "/islands/:id",
    async ({ params, userId, set }) => {
      try {
        const data = await getIslandById(params.id, userId);
        return ok(data);
      } catch (e: any) {
        console.error("[map/islands/:id]", e?.message, e?.stack);
        set.status = e.message === "ISLAND_NOT_FOUND" ? 404 : 500;
        return fail("Pulau tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Map"], summary: "Detail satu pulau" },
    },
  )

  // GET /map/islands/:id/chapters
  .get(
    "/islands/:id/chapters",
    async ({ params, userId, set }) => {
      try {
        const data = await getChaptersByIsland(params.id, userId);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("Pulau tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Map"],
        summary: "Daftar chapter di sebuah pulau beserta level-levelnya",
      },
    },
  )

  // GET /map/levels/:id
  .get(
    "/levels/:id",
    async ({ params, userId, set }) => {
      try {
        const data = await getLevelById(params.id, userId);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("Level tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Map"],
        summary: "Detail level beserta status progress user",
      },
    },
  );
