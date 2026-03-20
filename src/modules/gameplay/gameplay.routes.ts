// src/modules/gameplay/gameplay.routes.ts
import { Elysia, t } from "elysia";
import { authMiddleware } from "../auth/auth.routes";
import {
  startSession,
  submitSession,
  getSessionResult,
} from "./gameplay.service";
import { ok, created, fail } from "../../utils/response";

const startSessionSchema = t.Object({
  level_id: t.String(),
});

const submitSessionSchema = t.Object({
  answers: t.Array(
    t.Object({
      quiz_id: t.String(),
      selected_option_id: t.Optional(t.String()),
      answer_text: t.Optional(t.String()),
    }),
  ),
  time_spent_sec: t.Number({ minimum: 0 }),
});

export const gameplayRoutes = new Elysia({ prefix: "/gameplay" })
  .use(authMiddleware)

  // POST /gameplay/sessions/start
  .post(
    "/sessions/start",
    async ({ userId, body, set }) => {
      try {
        const data = await startSession(userId, body.level_id);
        set.status = 201;
        return created(data, "Sesi quiz dimulai");
      } catch (e: any) {
        const statusMap: Record<string, number> = {
          LEVEL_NOT_FOUND: 404,
          LEVEL_LOCKED: 403,
          SESSION_ACTIVE: 409,
          NO_QUESTIONS: 404,
        };
        const msgMap: Record<string, string> = {
          LEVEL_NOT_FOUND: "Level tidak ditemukan",
          LEVEL_LOCKED: "Level belum terbuka, selesaikan level sebelumnya",
          SESSION_ACTIVE: "Kamu masih punya sesi aktif di level ini",
          NO_QUESTIONS: "Level ini belum memiliki soal",
        };
        set.status = statusMap[e.message] ?? 500;
        return fail(msgMap[e.message] ?? "Gagal memulai sesi");
      }
    },
    {
      body: startSessionSchema,
      detail: { tags: ["Gameplay"], summary: "Mulai sesi quiz baru" },
    },
  )

  // GET /gameplay/sessions/:id
  .get(
    "/sessions/:id",
    async ({ userId, params, set }) => {
      try {
        const data = await getSessionResult(userId, params.id);
        return ok(data);
      } catch {
        set.status = 404;
        return fail("Sesi tidak ditemukan");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Gameplay"],
        summary: "Ambil detail sesi (aktif maupun selesai)",
      },
    },
  )

  // POST /gameplay/sessions/:id/submit
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
        return ok(
          data,
          data.isPassed ? "Selamat, kamu lulus!" : "Coba lagi ya!",
        );
      } catch (e: any) {
        const statusMap: Record<string, number> = {
          SESSION_NOT_FOUND: 404,
          LEVEL_NOT_FOUND: 404,
          USER_NOT_FOUND: 404,
        };
        set.status = statusMap[e.message] ?? 500;
        return fail(
          e.message === "SESSION_NOT_FOUND"
            ? "Sesi tidak ditemukan atau sudah selesai"
            : "Gagal submit jawaban",
        );
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: submitSessionSchema,
      detail: { tags: ["Gameplay"], summary: "Submit semua jawaban quiz" },
    },
  )

  // POST /gameplay/sessions/:id/abandon
  .post(
    "/sessions/:id/abandon",
    async ({ userId, params, set }) => {
      try {
        // Mark sesi sebagai selesai tanpa skor
        const { db } = await import("../../db");
        const { quizSessions } = await import("../../db/schema");
        const { eq, and } = await import("drizzle-orm");

        const [session] = await db
          .update(quizSessions)
          .set({ isCompleted: true, endedAt: new Date() })
          .where(
            and(
              eq(quizSessions.id, params.id),
              eq(quizSessions.userId, userId),
              eq(quizSessions.isCompleted, false),
            ),
          )
          .returning({ id: quizSessions.id });

        if (!session) {
          set.status = 404;
          return fail("Sesi tidak ditemukan atau sudah selesai");
        }

        return ok({ sessionId: session.id }, "Sesi dibatalkan");
      } catch {
        set.status = 500;
        return fail("Gagal membatalkan sesi");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Gameplay"],
        summary: "Batalkan sesi quiz yang sedang aktif",
      },
    },
  );
