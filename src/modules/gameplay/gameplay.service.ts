// src/modules/gameplay/gameplay.service.ts
import { db } from "../../db";
import {
  quizSessions,
  sessionAnswers,
  quizzes,
  quizOptions,
  markers,
  userProgress,
  users,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { calculateLevel } from "../../utils/xp";
import { evaluateAndAwardBadges } from "../../utils/badgeEngine";
import { updateWeeklyTaskProgress } from "../daily/daily.service";

// ── Start new session ────────────────────────────────────────
export const startSession = async (userId: string, markerId: string) => {
  const marker = await db.query.markers.findFirst({
    where: eq(markers.id, markerId),
  });
  if (!marker) throw new Error("MARKER_NOT_FOUND");

  // Cek apakah user punya cukup XP untuk unlock marker ini
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalXp: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const xpRequired = marker.xpRequired ?? 0;
  if (xpRequired > 0 && user.totalXp < xpRequired) {
    throw new Error("MARKER_LOCKED");
  }

  // Cek tidak ada sesi aktif
  const activeSession = await db.query.quizSessions.findFirst({
    where: and(
      eq(quizSessions.userId, userId),
      eq(quizSessions.markerId, markerId),
      eq(quizSessions.isCompleted, false),
    ),
  });
  if (activeSession) throw new Error("SESSION_ACTIVE");

  // Ambil semua soal untuk marker ini (tanpa jawaban benar)
  const allQuizzes = await db.query.quizzes.findMany({
    where: eq(quizzes.markerId, markerId),
    orderBy: (q, { asc }) => [asc(q.orderIndex)],
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

  if (!allQuizzes.length) throw new Error("NO_QUESTIONS");

  // Buat sesi baru
  const [session] = await db
    .insert(quizSessions)
    .values({
      userId,
      markerId,
      totalQuestions: allQuizzes.length,
    })
    .returning();

  return {
    sessionId: session.id,
    marker: {
      id: marker.id,
      name: marker.name,
      wilayah: marker.wilayah,
      xpReward: marker.xpReward,
    },
    questions: allQuizzes.map((q) => ({
      id: q.id,
      orderIndex: q.orderIndex,
      question: q.question,
      options: q.options,
    })),
    totalQuestions: allQuizzes.length,
    timeLimitSec: 600,
  };
};

// ── Submit all answers ───────────────────────────────────────
export const submitSession = async (
  userId: string,
  sessionId: string,
  answers: Array<{
    quiz_id: string;
    selected_option_id?: string;
    answer_text?: string;
  }>,
  timeSpentSec: number,
) => {
  // Validasi sesi milik user ini
  const session = await db.query.quizSessions.findFirst({
    where: and(
      eq(quizSessions.id, sessionId),
      eq(quizSessions.userId, userId),
      eq(quizSessions.isCompleted, false),
    ),
  });
  if (!session) throw new Error("SESSION_NOT_FOUND");

  // Ambil semua soal + jawaban benar
  const allQuizzes = await db.query.quizzes.findMany({
    where: eq(quizzes.markerId, session.markerId),
    with: { options: true },
  });

  // Evaluasi tiap jawaban
  let correctCount = 0;
  const breakdown: Array<{
    quizId: string;
    isCorrect: boolean;
    correctOptionId: string | null;
    selectedOptionId: string | null;
    explanation: string | null;
  }> = [];

  const answerRows = answers.map((answer) => {
    const quiz = allQuizzes.find((q) => q.id === answer.quiz_id);
    if (!quiz) return null;

    const correctOption = quiz.options.find((o) => o.isCorrect);
    const selectedOption = quiz.options.find(
      (o) => o.id === answer.selected_option_id,
    );

    const isCorrect = selectedOption?.isCorrect ?? false;
    if (isCorrect) correctCount++;

    breakdown.push({
      quizId: quiz.id,
      isCorrect,
      correctOptionId: correctOption?.id ?? null,
      selectedOptionId: answer.selected_option_id ?? null,
      explanation: quiz.explanation,
    });

    return {
      sessionId,
      quizId: answer.quiz_id,
      selectedOptionId: answer.selected_option_id ?? null,
      answerText: answer.answer_text ?? null,
      isCorrect,
    };
  });

  // Simpan jawaban
  const validAnswers = answerRows.filter(Boolean) as any[];
  if (validAnswers.length) {
    await db.insert(sessionAnswers).values(validAnswers);
  }

  const score = Math.round((correctCount / session.totalQuestions) * 100);

  // Ambil marker untuk xpReward & passing score
  const marker = await db.query.markers.findFirst({
    where: eq(markers.id, session.markerId),
  });
  if (!marker) throw new Error("MARKER_NOT_FOUND");

  // Lulus jika score >= 60
  const minScoreToPass = 60;
  const isPassed = score >= minScoreToPass;
  const xpReward = marker.xpReward ?? 0;
  const xpGained = isPassed ? xpReward : Math.round(xpReward * 0.2);

  // Update sesi sebagai selesai
  await db
    .update(quizSessions)
    .set({
      score,
      correctAnswers: correctCount,
      timeSpentSec,
      isCompleted: true,
      isPassed,
      xpGained,
      endedAt: new Date(),
    })
    .where(eq(quizSessions.id, sessionId));

  // Update XP & level user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { totalXp: true, level: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const newTotalXp = user.totalXp + xpGained;
  const newLevel = calculateLevel(newTotalXp);

  await db
    .update(users)
    .set({ totalXp: newTotalXp, level: newLevel, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Update atau insert user_progress untuk marker ini
  const existingProgress = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.markerId, session.markerId),
    ),
  });

  if (existingProgress) {
    await db
      .update(userProgress)
      .set({
        attempts: existingProgress.attempts + 1,
        bestScore: Math.max(existingProgress.bestScore, score),
        isCompleted: existingProgress.isCompleted || isPassed,
        completedAt:
          isPassed && !existingProgress.isCompleted
            ? new Date()
            : existingProgress.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.id, existingProgress.id));
  } else {
    await db.insert(userProgress).values({
      userId,
      markerId: session.markerId,
      bestScore: score,
      attempts: 1,
      isCompleted: isPassed,
      isUnlocked: true,
      completedAt: isPassed ? new Date() : null,
    });
  }

  // Update weekly task progress
  await updateWeeklyTaskProgress(userId, "complete_levels", isPassed ? 1 : 0);
  await updateWeeklyTaskProgress(userId, "collect_xp", xpGained);
  if (isPassed && score >= 100) {
    await updateWeeklyTaskProgress(userId, "perfect_score", 1);
  }

  // Cek badge baru
  const newBadges = await evaluateAndAwardBadges(userId);

  return {
    score,
    correctAnswers: correctCount,
    totalQuestions: session.totalQuestions,
    xpGained,
    newTotalXp,
    isPassed,
    newBadges,
    answerBreakdown: breakdown,
  };
};

// ── Get session result ───────────────────────────────────────
export const getSessionResult = async (userId: string, sessionId: string) => {
  const session = await db.query.quizSessions.findFirst({
    where: and(eq(quizSessions.id, sessionId), eq(quizSessions.userId, userId)),
    with: {
      answers: {
        with: {
          quiz: true,
          selectedOption: true,
        },
      },
      marker: true,
    },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  return session;
};
