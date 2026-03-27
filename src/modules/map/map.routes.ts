// src/modules/map/map.routes.ts
import { Elysia, t } from "elysia";
import { authMiddleware } from "../auth/auth.routes";
import {
  getAllIslands,
  getMarkersByIsland,
  getMarkerById,
} from "./map.service";
import { ok, fail } from "../../utils/response";

export const mapRoutes = new Elysia({ prefix: "/map" })
  .use(authMiddleware)

  // GET /map/islands — semua pulau + progress user
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

  // GET /map/islands/:id/markers — semua marker di pulau ini
  .get(
    "/islands/:id/markers",
    async ({ params, userId, set }) => {
      try {
        const data = await getMarkersByIsland(params.id, userId);
        return ok(data);
      } catch (e: any) {
        console.error("[map/islands/:id/markers]", e?.message, e?.stack);
        set.status = e.message === "ISLAND_NOT_FOUND" ? 404 : 500;
        return fail(
          e.message === "ISLAND_NOT_FOUND"
            ? "Pulau tidak ditemukan"
            : "Gagal mengambil marker",
        );
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Map"],
        summary: "Daftar semua marker di sebuah pulau beserta status unlock",
      },
    },
  )

  // GET /map/markers/:id — detail satu marker + quizzes
  .get(
    "/markers/:id",
    async ({ params, userId, set }) => {
      try {
        const data = await getMarkerById(params.id, userId);
        return ok(data);
      } catch (e: any) {
        console.error("[map/markers/:id]", e?.message, e?.stack);
        set.status = e.message === "MARKER_NOT_FOUND" ? 404 : 500;
        return fail(
          e.message === "MARKER_NOT_FOUND"
            ? "Marker tidak ditemukan"
            : "Gagal mengambil detail marker",
        );
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Map"],
        summary: "Detail satu marker beserta soal quiz dan progress user",
      },
    },
  );
