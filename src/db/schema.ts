// src/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const quizTypeEnum = pgEnum("quiz_type", [
  "multiple_choice",
  "true_false",
  "fill_blank",
]);

export const badgeCategoryEnum = pgEnum("badge_category", [
  "exploration",
  "achievement",
  "streak",
  "collection",
  "special",
]);

export const badgeCriteriaTypeEnum = pgEnum("badge_criteria_type", [
  "levels_completed",
  "chapters_completed",
  "islands_completed",
  "perfect_score",
  "total_xp",
  "badges_collected",
  "login_streak",
]);

export const weeklyTaskTypeEnum = pgEnum("weekly_task_type", [
  "complete_levels", // Selesaikan X level dalam seminggu
  "perfect_score", // Raih skor sempurna X kali
  "login_streak", // Login X hari berturut-turut
  "collect_xp", // Kumpulkan X XP dalam seminggu
]);

// ============================================================
// USERS
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    totalXp: integer("total_xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    loginStreak: integer("login_streak").notNull().default(0),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
  }),
);

// ============================================================
// ISLANDS
// ============================================================

export const islands = pgTable(
  "islands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    mapLat: doublePrecision("map_lat").notNull(),
    mapLng: doublePrecision("map_lng").notNull(),
    imageUrl: text("image_url"),
    isDefaultUnlocked: boolean("is_default_unlocked").notNull().default(false),
    unlockRequirement: integer("unlock_requirement").notNull().default(1),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("islands_slug_idx").on(t.slug),
    orderIdx: index("islands_order_idx").on(t.orderIndex),
  }),
);

// ============================================================
// CHAPTERS
// ============================================================

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    islandId: uuid("island_id")
      .notNull()
      .references(() => islands.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    regionName: varchar("region_name", { length: 150 }).notNull(),
    description: text("description"),
    pointLat: doublePrecision("point_lat").notNull(),
    pointLng: doublePrecision("point_lng").notNull(),
    imageUrl: text("image_url"),
    orderIndex: integer("order_index").notNull().default(0),
    totalLevels: integer("total_levels").notNull().default(5),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    islandIdx: index("chapters_island_idx").on(t.islandId),
    orderIdx: index("chapters_order_idx").on(t.islandId, t.orderIndex),
  }),
);

// ============================================================
// LEVELS
// ============================================================

export const levels = pgTable(
  "levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    levelNumber: integer("level_number").notNull(),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description"),
    eraPeriod: varchar("era_period", { length: 100 }),
    xpReward: integer("xp_reward").notNull().default(100),
    minScoreToPass: integer("min_score_to_pass").notNull().default(60),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    chapterIdx: index("levels_chapter_idx").on(t.chapterId),
    uniqueLevel: uniqueIndex("levels_chapter_number_unique").on(
      t.chapterId,
      t.levelNumber,
    ),
  }),
);

// ============================================================
// QUIZZES
// ============================================================

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    type: quizTypeEnum("type").notNull().default("multiple_choice"),
    imageUrl: text("image_url"),
    explanation: text("explanation"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    levelIdx: index("quizzes_level_idx").on(t.levelId),
  }),
);

// ============================================================
// QUIZ OPTIONS
// ============================================================

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => ({
    quizIdx: index("quiz_options_quiz_idx").on(t.quizId),
  }),
);

// ============================================================
// USER PROGRESS
// ============================================================

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    bestScore: integer("best_score").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueProgress: uniqueIndex("user_progress_unique").on(t.userId, t.levelId),
    userIdx: index("user_progress_user_idx").on(t.userId),
    levelIdx: index("user_progress_level_idx").on(t.levelId),
  }),
);

// ============================================================
// QUIZ SESSIONS
// ============================================================

export const quizSessions = pgTable(
  "quiz_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    score: integer("score"),
    totalQuestions: integer("total_questions").notNull(),
    correctAnswers: integer("correct_answers"),
    timeSpentSec: integer("time_spent_sec"),
    isCompleted: boolean("is_completed").notNull().default(false),
    isPassed: boolean("is_passed"),
    xpGained: integer("xp_gained"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
  },
  (t) => ({
    userIdx: index("quiz_sessions_user_idx").on(t.userId),
    levelIdx: index("quiz_sessions_level_idx").on(t.levelId),
  }),
);

// ============================================================
// SESSION ANSWERS
// ============================================================

export const sessionAnswers = pgTable(
  "session_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    selectedOptionId: uuid("selected_option_id").references(
      () => quizOptions.id,
    ),
    answerText: text("answer_text"),
    isCorrect: boolean("is_correct").notNull().default(false),
    answeredAt: timestamp("answered_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("session_answers_session_idx").on(t.sessionId),
    uniqueAnswer: uniqueIndex("session_answers_unique").on(
      t.sessionId,
      t.quizId,
    ),
  }),
);

// ============================================================
// BADGES
// ============================================================

export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description").notNull(),
    iconUrl: text("icon_url").notNull(),
    category: badgeCategoryEnum("category").notNull(),
    criteriaType: badgeCriteriaTypeEnum("criteria_type").notNull(),
    criteriaValue: integer("criteria_value").notNull(),
    xpReward: integer("xp_reward").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: uniqueIndex("badges_name_idx").on(t.name),
    categoryIdx: index("badges_category_idx").on(t.category),
  }),
);

// ============================================================
// USER BADGES
// ============================================================

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueUserBadge: uniqueIndex("user_badges_unique").on(t.userId, t.badgeId),
    userIdx: index("user_badges_user_idx").on(t.userId),
  }),
);

// ============================================================
// DAILY QUIZZES — bank soal harian (30 soal, 1 per hari)
// Soal dipilih deterministik berdasarkan: dayOfYear % totalSoal
// Sehingga semua user mendapat soal yang sama setiap harinya
// ============================================================

export const dailyQuizzes = pgTable(
  "daily_quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    type: quizTypeEnum("type").notNull().default("multiple_choice"),
    explanation: text("explanation").notNull(),
    // Topik sejarah: "Majapahit", "VOC", "Proklamasi", "Sriwijaya", dll
    topic: varchar("topic", { length: 100 }).notNull(),
    // easy | medium | hard
    difficulty: varchar("difficulty", { length: 20 })
      .notNull()
      .default("medium"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    topicIdx: index("daily_quizzes_topic_idx").on(t.topic),
    activeIdx: index("daily_quizzes_active_idx").on(t.isActive),
  }),
);

// ============================================================
// DAILY QUIZ OPTIONS
// ============================================================

export const dailyQuizOptions = pgTable(
  "daily_quiz_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dailyQuizId: uuid("daily_quiz_id")
      .notNull()
      .references(() => dailyQuizzes.id, { onDelete: "cascade" }),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => ({
    quizIdx: index("daily_quiz_options_quiz_idx").on(t.dailyQuizId),
  }),
);

// ============================================================
// USER DAILY PROGRESS — rekaman jawaban harian per user
// ============================================================

export const userDailyProgress = pgTable(
  "user_daily_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyQuizId: uuid("daily_quiz_id")
      .notNull()
      .references(() => dailyQuizzes.id, { onDelete: "cascade" }),
    // Format YYYY-MM-DD — satu baris per user per hari
    quizDate: date("quiz_date").notNull(),
    selectedOptionId: uuid("selected_option_id").references(
      () => dailyQuizOptions.id,
    ),
    answerText: text("answer_text"),
    isCorrect: boolean("is_correct").notNull().default(false),
    xpGained: integer("xp_gained").notNull().default(0),
    answeredAt: timestamp("answered_at").notNull().defaultNow(),
  },
  (t) => ({
    // Satu user hanya bisa menjawab satu kali per hari
    uniqueDaily: uniqueIndex("user_daily_progress_unique").on(
      t.userId,
      t.quizDate,
    ),
    userIdx: index("user_daily_progress_user_idx").on(t.userId),
    dateIdx: index("user_daily_progress_date_idx").on(t.quizDate),
  }),
);

// ============================================================
// WEEKLY TASKS — definisi task mingguan (template tetap)
// Reset otomatis setiap Senin 00:00
// ============================================================

export const weeklyTasks = pgTable(
  "weekly_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description").notNull(),
    type: weeklyTaskTypeEnum("type").notNull(),
    // Nilai target yang harus dicapai
    targetValue: integer("target_value").notNull(),
    xpReward: integer("xp_reward").notNull().default(50),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index("weekly_tasks_type_idx").on(t.type),
    activeIdx: index("weekly_tasks_active_idx").on(t.isActive),
  }),
);

// ============================================================
// USER WEEKLY TASKS — progress user per task per minggu
// ============================================================

export const userWeeklyTasks = pgTable(
  "user_weekly_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weeklyTaskId: uuid("weekly_task_id")
      .notNull()
      .references(() => weeklyTasks.id, { onDelete: "cascade" }),
    // Tanggal Senin awal minggu sebagai key periode (YYYY-MM-DD)
    weekStartDate: date("week_start_date").notNull(),
    currentValue: integer("current_value").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    // Apakah XP reward sudah diklaim (klaim manual oleh user)
    xpClaimed: boolean("xp_claimed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    // Satu baris per user per task per minggu
    uniqueWeekly: uniqueIndex("user_weekly_tasks_unique").on(
      t.userId,
      t.weeklyTaskId,
      t.weekStartDate,
    ),
    userIdx: index("user_weekly_tasks_user_idx").on(t.userId),
    weekIdx: index("user_weekly_tasks_week_idx").on(t.weekStartDate),
  }),
);

// ============================================================
// RELATIONS — existing
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  badges: many(userBadges),
  sessions: many(quizSessions),
  dailyProgress: many(userDailyProgress),
  weeklyTasks: many(userWeeklyTasks),
}));

export const islandsRelations = relations(islands, ({ many }) => ({
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  island: one(islands, {
    fields: [chapters.islandId],
    references: [islands.id],
  }),
  levels: many(levels),
}));

export const levelsRelations = relations(levels, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [levels.chapterId],
    references: [chapters.id],
  }),
  quizzes: many(quizzes),
  userProgress: many(userProgress),
  sessions: many(quizSessions),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  level: one(levels, { fields: [quizzes.levelId], references: [levels.id] }),
  options: many(quizOptions),
  sessionAnswers: many(sessionAnswers),
}));

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizOptions.quizId],
    references: [quizzes.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  level: one(levels, {
    fields: [userProgress.levelId],
    references: [levels.id],
  }),
}));

export const quizSessionsRelations = relations(
  quizSessions,
  ({ one, many }) => ({
    user: one(users, { fields: [quizSessions.userId], references: [users.id] }),
    level: one(levels, {
      fields: [quizSessions.levelId],
      references: [levels.id],
    }),
    answers: many(sessionAnswers),
  }),
);

export const sessionAnswersRelations = relations(sessionAnswers, ({ one }) => ({
  session: one(quizSessions, {
    fields: [sessionAnswers.sessionId],
    references: [quizSessions.id],
  }),
  quiz: one(quizzes, {
    fields: [sessionAnswers.quizId],
    references: [quizzes.id],
  }),
  selectedOption: one(quizOptions, {
    fields: [sessionAnswers.selectedOptionId],
    references: [quizOptions.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

// ============================================================
// RELATIONS — daily & weekly (baru)
// ============================================================

export const dailyQuizzesRelations = relations(dailyQuizzes, ({ many }) => ({
  options: many(dailyQuizOptions),
  userProgress: many(userDailyProgress),
}));

export const dailyQuizOptionsRelations = relations(
  dailyQuizOptions,
  ({ one }) => ({
    dailyQuiz: one(dailyQuizzes, {
      fields: [dailyQuizOptions.dailyQuizId],
      references: [dailyQuizzes.id],
    }),
  }),
);

export const userDailyProgressRelations = relations(
  userDailyProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userDailyProgress.userId],
      references: [users.id],
    }),
    dailyQuiz: one(dailyQuizzes, {
      fields: [userDailyProgress.dailyQuizId],
      references: [dailyQuizzes.id],
    }),
    selectedOption: one(dailyQuizOptions, {
      fields: [userDailyProgress.selectedOptionId],
      references: [dailyQuizOptions.id],
    }),
  }),
);

export const weeklyTasksRelations = relations(weeklyTasks, ({ many }) => ({
  userWeeklyTasks: many(userWeeklyTasks),
}));

export const userWeeklyTasksRelations = relations(
  userWeeklyTasks,
  ({ one }) => ({
    user: one(users, {
      fields: [userWeeklyTasks.userId],
      references: [users.id],
    }),
    weeklyTask: one(weeklyTasks, {
      fields: [userWeeklyTasks.weeklyTaskId],
      references: [weeklyTasks.id],
    }),
  }),
);

// ============================================================
// TYPE EXPORTS
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Island = typeof islands.$inferSelect;
export type NewIsland = typeof islands.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizOption = typeof quizOptions.$inferSelect;
export type NewQuizOption = typeof quizOptions.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type QuizSession = typeof quizSessions.$inferSelect;
export type NewQuizSession = typeof quizSessions.$inferInsert;
export type SessionAnswer = typeof sessionAnswers.$inferSelect;
export type NewSessionAnswer = typeof sessionAnswers.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type DailyQuiz = typeof dailyQuizzes.$inferSelect;
export type NewDailyQuiz = typeof dailyQuizzes.$inferInsert;
export type DailyQuizOption = typeof dailyQuizOptions.$inferSelect;
export type NewDailyQuizOption = typeof dailyQuizOptions.$inferInsert;
export type UserDailyProgress = typeof userDailyProgress.$inferSelect;
export type NewUserDailyProgress = typeof userDailyProgress.$inferInsert;
export type WeeklyTask = typeof weeklyTasks.$inferSelect;
export type NewWeeklyTask = typeof weeklyTasks.$inferInsert;
export type UserWeeklyTask = typeof userWeeklyTasks.$inferSelect;
export type NewUserWeeklyTask = typeof userWeeklyTasks.$inferInsert;
