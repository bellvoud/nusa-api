// src/modules/daily/daily.routes.ts
import { Elysia, t } from "elysia";
import { authMiddleware } from "../auth/auth.routes";
import {
  getDailyQuiz,
  submitDailyQuiz,
  getWeeklyTasks,
  claimWeeklyTaskXp,
  getDailyHistory,
} from "./daily.service";
import { ok, created, fail } from "../../utils/response";

const submitDailySchema = t.Object({
  selected_option_id: t.Optional(t.String()),
  answer_text: t.Optional(t.String()),
});

export const dailyRoutes = new Elysia({ prefix: "/daily" })
  .use(authMiddleware)

  // GET /daily/quiz
  .get(
    "/quiz",
    async ({ userId, set }) => {
      try {
        const data = await getDailyQuiz(userId);
        return ok(data);
      } catch (e: any) {
        set.status = 404;
        return fail("Soal harian belum tersedia");
      }
    },
    {
      detail: {
        tags: ["Daily"],
        summary: "Ambil soal quiz harian hari ini beserta status jawaban user",
      },
    },
  )

  // POST /daily/quiz/submit
  .post(
    "/quiz/submit",
    async ({ userId, body, set }) => {
      try {
        const data = await submitDailyQuiz(userId, body);
        set.status = 201;
        return created(
          data,
          data.isCorrect
            ? "Jawaban benar! +20 XP"
            : "Jawaban salah. +5 XP partisipasi",
        );
      } catch (e: any) {
        const statusMap: Record<string, number> = {
          ALREADY_ANSWERED: 409,
          NO_DAILY_QUIZ: 404,
          USER_NOT_FOUND: 404,
        };
        const msgMap: Record<string, string> = {
          ALREADY_ANSWERED: "Kamu sudah menjawab quiz hari ini, kembali besok!",
          NO_DAILY_QUIZ: "Soal harian belum tersedia",
          USER_NOT_FOUND: "User tidak ditemukan",
        };
        set.status = statusMap[e.message] ?? 500;
        return fail(msgMap[e.message] ?? "Gagal submit jawaban harian");
      }
    },
    {
      body: submitDailySchema,
      detail: {
        tags: ["Daily"],
        summary: "Submit jawaban quiz harian (hanya bisa 1x per hari)",
      },
    },
  )

  // GET /daily/history
  .get(
    "/history",
    async ({ userId, set }) => {
      try {
        const data = await getDailyHistory(userId);
        return ok(data);
      } catch {
        set.status = 500;
        return fail("Gagal mengambil riwayat quiz harian");
      }
    },
    {
      detail: {
        tags: ["Daily"],
        summary: "Riwayat jawaban quiz harian 30 hari terakhir",
      },
    },
  )

  // GET /daily/weekly-tasks
  .get(
    "/weekly-tasks",
    async ({ userId, set }) => {
      try {
        const data = await getWeeklyTasks(userId);
        return ok(data);
      } catch {
        set.status = 500;
        return fail("Gagal mengambil weekly tasks");
      }
    },
    {
      detail: {
        tags: ["Daily"],
        summary: "Daftar weekly task minggu ini beserta progress user",
      },
    },
  )

  // POST /daily/weekly-tasks/:id/claim
  .post(
    "/weekly-tasks/:id/claim",
    async ({ userId, params, set }) => {
      try {
        const data = await claimWeeklyTaskXp(userId, params.id);
        return ok(data, `XP berhasil diklaim! +${data.xpGained} XP`);
      } catch (e: any) {
        const statusMap: Record<string, number> = {
          TASK_NOT_FOUND: 404,
          TASK_NOT_COMPLETED: 400,
          ALREADY_CLAIMED: 409,
          USER_NOT_FOUND: 404,
        };
        const msgMap: Record<string, string> = {
          TASK_NOT_FOUND: "Task tidak ditemukan",
          TASK_NOT_COMPLETED: "Task belum selesai, terus semangat!",
          ALREADY_CLAIMED: "XP untuk task ini sudah diklaim",
          USER_NOT_FOUND: "User tidak ditemukan",
        };
        set.status = statusMap[e.message] ?? 500;
        return fail(msgMap[e.message] ?? "Gagal klaim XP");
      }
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Daily"],
        summary: "Klaim XP reward weekly task yang sudah selesai",
      },
    },
  );
