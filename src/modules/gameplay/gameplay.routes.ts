// src/modules/gameplay/gameplay.routes.ts
import { Elysia, t } from "elysia";
import { authMiddleware } from "../auth/auth.routes";
import {
  startSession,
  submitSession,
  getSessionResult,
} from "./gameplay.service";
import { ok, created, fail } from "../../utils/response";

export const gameplayRoutes = new Elysia({ prefix: "/gameplay" })
  .use(authMiddleware)

  // POST /gameplay/sessions — mulai sesi quiz baru
  .post(
    "/sessions",
    async ({ userId, body, set }) => {
      try {
        const data = await startSession(userId, body.marker_id);
        set.status = 201;
        return created(data, "Sesi berhasil dimulai");
      } catch (e: any) {
        const msg = e.message;
        if (msg === "MARKER_NOT_FOUND") {
          set.status = 404;
          return fail("Marker tidak ditemukan");
        }
        if (msg === "MARKER_LOCKED") {
          set.status = 403;
          return fail("XP kamu belum cukup untuk membuka quest ini");
        }
        if (msg === "SESSION_ACTIVE") {
          set.status = 409;
          return fail("Kamu masih memiliki sesi aktif untuk marker ini");
        }
        if (msg === "NO_QUESTIONS") {
          set.status = 422;
          return fail("Quest ini belum memiliki soal");
        }
        console.error("[gameplay/sessions POST]", msg, e?.stack);
        set.status = 500;
        return fail("Gagal memulai sesi");
      }
    },
    {
      body: t.Object({
        marker_id: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Gameplay"],
        summary: "Mulai sesi quiz baru untuk sebuah marker",
      },
    },
  )

  // POST /gameplay/sessions/:id/submit — submit semua jawaban
  .post(
    "/sessions/:id/submit",
    async ({ userId, params, body, set }) => {
      try {
        const data = await submitSession(
          userId,
          params.id,
          body.answers,
          body.time_spent_sec,
        );
        return ok(data, "Jawaban berhasil disubmit");
      } catch (e: any) {
        const msg = e.message;
        if (msg === "SESSION_NOT_FOUND") {
          set.status = 404;
          return fail("Sesi tidak ditemukan atau sudah selesai");
        }
        if (msg === "MARKER_NOT_FOUND") {
          set.status = 404;
          return fail("Marker tidak ditemukan");
        }
        console.error("[gameplay/sessions/:id/submit]", msg, e?.stack);
        set.status = 500;
        return fail("Gagal mengirim jawaban");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        answers: t.Array(
          t.Object({
            quiz_id: t.String(),
            selected_option_id: t.Optional(t.String()),
            answer_text: t.Optional(t.String()),
          }),
        ),
        time_spent_sec: t.Number(),
      }),
      detail: {
        tags: ["Gameplay"],
        summary: "Submit semua jawaban dan dapatkan hasil serta XP",
      },
    },
  )

  // GET /gameplay/sessions/:id/result — lihat hasil sesi
  .get(
    "/sessions/:id/result",
    async ({ userId, params, set }) => {
      try {
        const data = await getSessionResult(userId, params.id);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("Hasil sesi tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Gameplay"],
        summary: "Ambil hasil sesi quiz yang sudah selesai",
      },
    },
  );
