// src/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
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
  "complete_levels",
  "perfect_score",
  "login_streak",
  "collect_xp",
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
// MARKERS — pengganti chapters + levels
// Setiap marker = satu lokasi di peta dengan quiz tersendiri
// ============================================================

export const markers = pgTable(
  "markers",
  {
    // id pakai text (bukan uuid) sesuai struktur DB di Supabase
    id: text("id").primaryKey(),
    islandId: text("island_id")
      .notNull()
      .references(() => islands.id, { onDelete: "cascade" }),
    name: text("name"),
    slug: text("slug"),
    // Posisi marker di peta (dalam %, misal "45%", "30%")
    posTop: text("pos_top"),
    posLeft: text("pos_left"),
    xpReward: bigint("xp_reward", { mode: "number" }),
    xpRequired: bigint("xp_required", { mode: "number" }),
    totalSoal: bigint("total_soal", { mode: "number" }),
    wilayah: text("wilayah"),
    // Field tambahan untuk QuestCard di frontend
    imageUrl: text("image_url"),
    thumbnail: text("thumbnail"),
    deskripsi: text("deskripsi"),
    orderIndex: integer("order_index").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    islandIdx: index("markers_island_idx").on(t.islandId),
  }),
);

// ============================================================
// QUIZZES — sekarang punya marker_id (bukan level_id)
// ============================================================

export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    markerId: text("marker_id")
      .notNull()
      .references(() => markers.id, { onDelete: "cascade" }),
    question: text("question"),
    explanation: text("explanation"),
    orderIndex: bigint("order_index", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    markerIdx: index("quizzes_marker_idx").on(t.markerId),
  }),
);

// ============================================================
// QUIZ OPTIONS
// ============================================================

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    optionText: text("option_text"),
    isCorrect: boolean("is_correct"),
    orderIndex: bigint("order_index", { mode: "number" }),
  },
  (t) => ({
    quizIdx: index("quiz_options_quiz_idx").on(t.quizId),
  }),
);

// ============================================================
// USER PROGRESS — track per marker (bukan per level)
// ============================================================

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // markerId menggantikan levelId
    markerId: text("marker_id")
      .notNull()
      .references(() => markers.id, { onDelete: "cascade" }),
    bestScore: integer("best_score").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueProgress: uniqueIndex("user_progress_unique").on(
      t.userId,
      t.markerId,
    ),
    userIdx: index("user_progress_user_idx").on(t.userId),
    markerIdx: index("user_progress_marker_idx").on(t.markerId),
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
    // markerId menggantikan levelId di sessions
    markerId: text("marker_id")
      .notNull()
      .references(() => markers.id, { onDelete: "cascade" }),
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
    markerIdx: index("quiz_sessions_marker_idx").on(t.markerId),
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
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    selectedOptionId: text("selected_option_id").references(
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
// DAILY QUIZZES
// ============================================================

export const dailyQuizzes = pgTable(
  "daily_quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    type: quizTypeEnum("type").notNull().default("multiple_choice"),
    explanation: text("explanation").notNull(),
    topic: varchar("topic", { length: 100 }).notNull(),
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
// USER DAILY PROGRESS
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
    uniqueDaily: uniqueIndex("user_daily_progress_unique").on(
      t.userId,
      t.quizDate,
    ),
    userIdx: index("user_daily_progress_user_idx").on(t.userId),
    dateIdx: index("user_daily_progress_date_idx").on(t.quizDate),
  }),
);

// ============================================================
// WEEKLY TASKS
// ============================================================

export const weeklyTasks = pgTable(
  "weekly_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description").notNull(),
    type: weeklyTaskTypeEnum("type").notNull(),
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
// USER WEEKLY TASKS
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
    weekStartDate: date("week_start_date").notNull(),
    currentValue: integer("current_value").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    xpClaimed: boolean("xp_claimed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
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
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  badges: many(userBadges),
  sessions: many(quizSessions),
  dailyProgress: many(userDailyProgress),
  weeklyTasks: many(userWeeklyTasks),
}));

export const islandsRelations = relations(islands, ({ many }) => ({
  markers: many(markers),
}));

export const markersRelations = relations(markers, ({ one, many }) => ({
  island: one(islands, {
    fields: [markers.islandId],
    references: [islands.id],
  }),
  quizzes: many(quizzes),
  userProgress: many(userProgress),
  sessions: many(quizSessions),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  marker: one(markers, {
    fields: [quizzes.markerId],
    references: [markers.id],
  }),
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
  marker: one(markers, {
    fields: [userProgress.markerId],
    references: [markers.id],
  }),
}));

export const quizSessionsRelations = relations(
  quizSessions,
  ({ one, many }) => ({
    user: one(users, { fields: [quizSessions.userId], references: [users.id] }),
    marker: one(markers, {
      fields: [quizSessions.markerId],
      references: [markers.id],
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
export type Marker = typeof markers.$inferSelect;
export type NewMarker = typeof markers.$inferInsert;
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
