// src/modules/gameplay/gameplay.service.ts
import { db } from "../../db";
import {
  quizSessions,
  sessionAnswers,
  quizzes,
  quizOptions,
  levels,
  userProgress,
  users,
} from "../../db/schema";
import { eq, and, gte } from "drizzle-orm";
import { calculateLevel } from "../../utils/xp";
import { evaluateAndAwardBadges } from "../../utils/badgeEngine";

// ── Start new session ───────────────────────────────────────
export const startSession = async (userId: string, levelId: string) => {
  // check level exists
  const level = await db.query.levels.findFirst({
    where: eq(levels.id, levelId),
  });
  if (!level) throw new Error("LEVEL_NOT_FOUND");

  // check if level already unlocked for this user
  const progress = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.levelId, levelId),
    ),
  });

  const isFirstLevel = level.levelNumber === 1;
  if (!isFirstLevel && !progress?.isUnlocked) {
    throw new Error("LEVEL_LOCKED");
  }

  // check no active session
  const activeSession = await db.query.quizSessions.findFirst({
    where: and(
      eq(quizSessions.userId, userId),
      eq(quizSessions.levelId, levelId),
      eq(quizSessions.isCompleted, false),
    ),
  });
  if (activeSession) throw new Error("SESSION_ACTIVE");

  // get all quizzes (without correct answers)
  const allQuizzes = await db.query.quizzes.findMany({
    where: eq(quizzes.levelId, levelId),
    orderBy: (q, { asc }) => [asc(q.orderIndex)],
    with: {
      options: {
        columns: {
          id: true,
          optionText: true,
          orderIndex: true,
          // isCorrect intentionally not taken
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
      levelId,
      totalQuestions: allQuizzes.length,
    })
    .returning();

  return {
    sessionId: session.id,
    level: {
      id: level.id,
      title: level.title,
      eraPeriod: level.eraPeriod,
      xpReward: level.xpReward,
    },
    questions: allQuizzes.map((q) => ({
      id: q.id,
      orderIndex: q.orderIndex,
      type: q.type,
      question: q.question,
      imageUrl: q.imageUrl,
      options: q.options,
    })),
    totalQuestions: allQuizzes.length,
    timeLimitSec: 600,
  };
};

// ── Submit all answers ─────────────────────────────────────
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
  // check valid session owned by this user
  const session = await db.query.quizSessions.findFirst({
    where: and(
      eq(quizSessions.id, sessionId),
      eq(quizSessions.userId, userId),
      eq(quizSessions.isCompleted, false),
    ),
  });
  if (!session) throw new Error("SESSION_NOT_FOUND");

  // get all quizzes + correct answers
  const allQuizzes = await db.query.quizzes.findMany({
    where: eq(quizzes.levelId, session.levelId),
    with: { options: true },
  });

  // evaluate each answer
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

    let isCorrect = false;
    let correctOptionId: string | null = null;

    if (quiz.type === "fill_blank") {
      // compare text (case-insensitive)
      const correctOption = quiz.options.find((o) => o.isCorrect);
      correctOptionId = correctOption?.id ?? null;
      isCorrect =
        answer.answer_text?.trim().toLowerCase() ===
        correctOption?.optionText.trim().toLowerCase();
    } else {
      const selectedOption = quiz.options.find(
        (o) => o.id === answer.selected_option_id,
      );
      const correctOption = quiz.options.find((o) => o.isCorrect);
      correctOptionId = correctOption?.id ?? null;
      isCorrect = selectedOption?.isCorrect ?? false;
    }

    if (isCorrect) correctCount++;

    breakdown.push({
      quizId: quiz.id,
      isCorrect,
      correctOptionId,
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

  // save answers to DB
  const validAnswers = answerRows.filter(Boolean) as any[];
  if (validAnswers.length) {
    await db.insert(sessionAnswers).values(validAnswers);
  }

  const score = Math.round((correctCount / session.totalQuestions) * 100);

  // get level to check passing score & XP
  const level = await db.query.levels.findFirst({
    where: eq(levels.id, session.levelId),
  });
  if (!level) throw new Error("LEVEL_NOT_FOUND");

  const isPassed = score >= level.minScoreToPass;
  const xpGained = isPassed ? level.xpReward : Math.round(level.xpReward * 0.2);

  // update session as completed
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

  // Update user XP & level
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

  // Update atau insert user_progress
  const existingProgress = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.levelId, session.levelId),
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
      levelId: session.levelId,
      bestScore: score,
      attempts: 1,
      isCompleted: isPassed,
      isUnlocked: true,
      completedAt: isPassed ? new Date() : null,
    });
  }

  // Unlock level berikutnya jika lulus
  let nextLevelUnlocked = false;
  if (isPassed) {
    const nextLevel = await db.query.levels.findFirst({
      where: and(
        eq(levels.chapterId, level.chapterId),
        eq(levels.levelNumber, level.levelNumber + 1),
      ),
    });

    if (nextLevel) {
      const nextProgress = await db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, userId),
          eq(userProgress.levelId, nextLevel.id),
        ),
      });

      if (!nextProgress) {
        await db.insert(userProgress).values({
          userId,
          levelId: nextLevel.id,
          isUnlocked: true,
          isCompleted: false,
        });
        nextLevelUnlocked = true;
      }
    }
  }

  // Cek badge yang baru unlock
  const newBadges = await evaluateAndAwardBadges(userId);

  return {
    score,
    correctAnswers: correctCount,
    totalQuestions: session.totalQuestions,
    xpGained,
    isPassed,
    nextLevelUnlocked,
    newBadges,
    answerBreakdown: breakdown,
  };
};

// ── Get result sesi ──────────────────────────────────────────
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
      level: true,
    },
  });

  if (!session) throw new Error("SESSION_NOT_FOUND");
  return session;
};
