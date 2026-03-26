// src/modules/daily/daily.service.ts
import { db } from "../../db";
import {
  dailyQuizzes,
  dailyQuizOptions,
  userDailyProgress,
  weeklyTasks,
  userWeeklyTasks,
  users,
  quizSessions,
  userProgress,
} from "../../db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { calculateLevel } from "../../utils/xp";

// ── Helper: tanggal hari ini (WIB, format YYYY-MM-DD) ────────
export const getTodayDate = (): string => {
  const now = new Date();
  // Offset WIB = UTC+7
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split("T")[0];
};

// ── Helper: tanggal Senin minggu ini (WIB) ───────────────────
export const getWeekStartDate = (): string => {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = wib.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(wib);
  monday.setUTCDate(wib.getUTCDate() + diffToMonday);
  return monday.toISOString().split("T")[0];
};

// ── Pilih soal harian secara deterministik ───────────────────
// Semua user mendapat soal yang sama setiap harinya
const selectDailyQuiz = async () => {
  const allQuizzes = await db.query.dailyQuizzes.findMany({
    where: eq(dailyQuizzes.isActive, true),
    columns: { id: true },
    orderBy: (q, { asc }) => [asc(q.createdAt)],
  });

  if (!allQuizzes.length) throw new Error("NO_DAILY_QUIZ");

  // Hitung dayOfYear untuk pemilihan soal yang deterministik
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx = dayOfYear % allQuizzes.length;

  return allQuizzes[idx].id;
};

// ── GET soal harian + status user ────────────────────────────
export const getDailyQuiz = async (userId: string) => {
  const today = getTodayDate();
  const quizId = await selectDailyQuiz();

  const quiz = await db.query.dailyQuizzes.findFirst({
    where: eq(dailyQuizzes.id, quizId),
    with: {
      options: {
        columns: {
          id: true,
          optionText: true,
          orderIndex: true,
          // isCorrect sengaja tidak diambil
        },
        orderBy: (o, { asc }) => [asc(o.orderIndex)],
      },
    },
  });

  if (!quiz) throw new Error("NO_DAILY_QUIZ");

  // Cek apakah user sudah menjawab hari ini
  const existing = await db.query.userDailyProgress.findFirst({
    where: and(
      eq(userDailyProgress.userId, userId),
      eq(userDailyProgress.quizDate, today),
    ),
    with: { selectedOption: true },
  });

  return {
    quizDate: today,
    isAnswered: !!existing,
    xpReward: 20,
    quiz: {
      id: quiz.id,
      question: quiz.question,
      type: quiz.type,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      imageUrl: quiz.imageUrl,
      options: quiz.options,
      // Tampilkan penjelasan & jawaban benar jika sudah dijawab
      explanation: existing ? quiz.explanation : null,
    },
    // Hasil jawaban user jika sudah menjawab
    result: existing
      ? {
          isCorrect: existing.isCorrect,
          xpGained: existing.xpGained,
          selectedOptionId: existing.selectedOptionId,
          answeredAt: existing.answeredAt,
        }
      : null,
  };
};

// ── Submit jawaban harian ────────────────────────────────────
export const submitDailyQuiz = async (
  userId: string,
  input: { selected_option_id?: string; answer_text?: string },
) => {
  const today = getTodayDate();

  // Cek sudah dijawab hari ini
  const existing = await db.query.userDailyProgress.findFirst({
    where: and(
      eq(userDailyProgress.userId, userId),
      eq(userDailyProgress.quizDate, today),
    ),
  });
  if (existing) throw new Error("ALREADY_ANSWERED");

  const quizId = await selectDailyQuiz();
  const quiz = await db.query.dailyQuizzes.findFirst({
    where: eq(dailyQuizzes.id, quizId),
    with: { options: true },
  });
  if (!quiz) throw new Error("NO_DAILY_QUIZ");

  // Nilai jawaban
  let isCorrect = false;
  if (quiz.type === "fill_blank") {
    const correctOption = quiz.options.find((o) => o.isCorrect);
    isCorrect =
      input.answer_text?.trim().toLowerCase() ===
      correctOption?.optionText.trim().toLowerCase();
  } else {
    const selected = quiz.options.find(
      (o) => o.id === input.selected_option_id,
    );
    isCorrect = selected?.isCorrect ?? false;
  }

  // XP selalu 20 untuk quiz harian (benar maupun salah dapat XP partisipasi)
  const xpGained = isCorrect ? 20 : 5;

  // Simpan jawaban
  await db.insert(userDailyProgress).values({
    userId,
    dailyQuizId: quizId,
    quizDate: today,
    selectedOptionId: input.selected_option_id ?? null,
    answerText: input.answer_text ?? null,
    isCorrect,
    xpGained,
  });

  // Update XP user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalXp: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const newTotalXp = user.totalXp + xpGained;
  const newLevel = calculateLevel(newTotalXp);
  await db
    .update(users)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Update weekly task collect_xp
  await updateWeeklyTaskProgress(userId, "collect_xp", xpGained);

  // Cari jawaban yang benar untuk dikembalikan ke user
  const correctOption = quiz.options.find((o) => o.isCorrect);

  return {
    isCorrect,
    xpGained,
    correctOptionId: correctOption?.id ?? null,
    explanation: quiz.explanation,
  };
};

// ── GET semua weekly tasks + progress user ───────────────────
export const getWeeklyTasks = async (userId: string) => {
  const weekStart = getWeekStartDate();

  const allTasks = await db.query.weeklyTasks.findMany({
    where: eq(weeklyTasks.isActive, true),
    orderBy: (t, { asc }) => [asc(t.type)],
  });

  // Pastikan semua task punya row progress untuk user ini minggu ini
  for (const task of allTasks) {
    const exists = await db.query.userWeeklyTasks.findFirst({
      where: and(
        eq(userWeeklyTasks.userId, userId),
        eq(userWeeklyTasks.weeklyTaskId, task.id),
        eq(userWeeklyTasks.weekStartDate, weekStart),
      ),
    });
    if (!exists) {
      await db.insert(userWeeklyTasks).values({
        userId,
        weeklyTaskId: task.id,
        weekStartDate: weekStart,
      });
    }
  }

  // Ambil progress terbaru
  const userProgress_ = await db.query.userWeeklyTasks.findMany({
    where: and(
      eq(userWeeklyTasks.userId, userId),
      eq(userWeeklyTasks.weekStartDate, weekStart),
    ),
    with: { weeklyTask: true },
  });

  return {
    weekStartDate: weekStart,
    tasks: userProgress_.map((up) => ({
      id: up.id,
      taskId: up.weeklyTaskId,
      title: up.weeklyTask.title,
      description: up.weeklyTask.description,
      type: up.weeklyTask.type,
      targetValue: up.weeklyTask.targetValue,
      currentValue: up.currentValue,
      progressPercent: Math.min(
        100,
        Math.floor((up.currentValue / up.weeklyTask.targetValue) * 100),
      ),
      isCompleted: up.isCompleted,
      xpReward: up.weeklyTask.xpReward,
      xpClaimed: up.xpClaimed,
      completedAt: up.completedAt,
    })),
  };
};

// ── Klaim XP weekly task yang sudah selesai ──────────────────
export const claimWeeklyTaskXp = async (
  userId: string,
  userWeeklyTaskId: string,
) => {
  const taskProgress = await db.query.userWeeklyTasks.findFirst({
    where: and(
      eq(userWeeklyTasks.id, userWeeklyTaskId),
      eq(userWeeklyTasks.userId, userId),
    ),
    with: { weeklyTask: true },
  });

  if (!taskProgress) throw new Error("TASK_NOT_FOUND");
  if (!taskProgress.isCompleted) throw new Error("TASK_NOT_COMPLETED");
  if (taskProgress.xpClaimed) throw new Error("ALREADY_CLAIMED");

  const xpReward = taskProgress.weeklyTask.xpReward;

  // Tandai sudah diklaim
  await db
    .update(userWeeklyTasks)
    .set({ xpClaimed: true, updatedAt: new Date() })
    .where(eq(userWeeklyTasks.id, userWeeklyTaskId));

  // Tambah XP ke user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalXp: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const newTotalXp = user.totalXp + xpReward;
  const newLevel = calculateLevel(newTotalXp);
  await db
    .update(users)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { xpGained: xpReward, newTotalXp };
};

// ── Update progress weekly task (dipanggil dari gameplay & auth) ─
export const updateWeeklyTaskProgress = async (
  userId: string,
  taskType: "complete_levels" | "perfect_score" | "login_streak" | "collect_xp",
  increment: number,
) => {
  const weekStart = getWeekStartDate();

  // Ambil semua task aktif dengan type ini
  const matchingTasks = await db.query.weeklyTasks.findMany({
    where: and(eq(weeklyTasks.isActive, true), eq(weeklyTasks.type, taskType)),
  });

  for (const task of matchingTasks) {
    // Cari atau buat progress row
    let progress = await db.query.userWeeklyTasks.findFirst({
      where: and(
        eq(userWeeklyTasks.userId, userId),
        eq(userWeeklyTasks.weeklyTaskId, task.id),
        eq(userWeeklyTasks.weekStartDate, weekStart),
      ),
    });

    if (!progress) {
      const [created] = await db
        .insert(userWeeklyTasks)
        .values({
          userId,
          weeklyTaskId: task.id,
          weekStartDate: weekStart,
          currentValue: 0,
        })
        .returning();
      progress = created;
    }

    if (progress.isCompleted) continue;

    const newValue = progress.currentValue + increment;
    const isNowCompleted = newValue >= task.targetValue;

    await db
      .update(userWeeklyTasks)
      .set({
        currentValue: Math.min(newValue, task.targetValue),
        isCompleted: isNowCompleted,
        completedAt: isNowCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(userWeeklyTasks.id, progress.id));
  }
};

// ── Riwayat quiz harian (7 hari terakhir) ────────────────────
export const getDailyHistory = async (userId: string) => {
  const history = await db.query.userDailyProgress.findMany({
    where: eq(userDailyProgress.userId, userId),
    with: {
      dailyQuiz: {
        columns: { topic: true, difficulty: true, question: true },
      },
    },
    orderBy: (h, { desc }) => [desc(h.quizDate)],
    limit: 30,
  });

  return history.map((h) => ({
    quizDate: h.quizDate,
    topic: h.dailyQuiz.topic,
    difficulty: h.dailyQuiz.difficulty,
    isCorrect: h.isCorrect,
    xpGained: h.xpGained,
    answeredAt: h.answeredAt,
  }));
};
