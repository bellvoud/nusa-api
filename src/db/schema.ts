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
  "exploration", // unlock pulau / chapter baru
  "achievement", // selesaikan level dengan skor tertentu
  "streak", // main N hari berturut-turut
  "collection", // kumpulkan badge tertentu
  "special", // event / milestone khusus
]);

export const badgeCriteriaTypeEnum = pgEnum("badge_criteria_type", [
  "levels_completed",
  "chapters_completed",
  "islands_completed",
  "perfect_score", // skor 100 di sebuah level
  "total_xp",
  "badges_collected",
  "login_streak",
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
    // Island ke-1 (Jawa) langsung unlocked, sisanya dikunci
    isDefaultUnlocked: boolean("is_default_unlocked").notNull().default(false),
    // Berapa chapter harus selesai di island sebelumnya untuk unlock island ini
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
// CHAPTERS (titik pada peta di setiap pulau)
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
// LEVELS (5 level per chapter)
// ============================================================

export const levels = pgTable(
  "levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    levelNumber: integer("level_number").notNull(), // 1–5
    title: varchar("title", { length: 150 }).notNull(),
    description: text("description"),
    eraPeriod: varchar("era_period", { length: 100 }), // contoh: "Abad ke-14"
    xpReward: integer("xp_reward").notNull().default(100),
    // Skor minimum (dari 100) untuk lulus level
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
// QUIZZES (soal-soal dalam setiap level)
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
// QUIZ OPTIONS (pilihan jawaban)
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
// USER PROGRESS (status per user per level)
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
// QUIZ SESSIONS (rekaman setiap kali user main)
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
// SESSION ANSWERS (jawaban per soal dalam sebuah sesi)
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
// USER BADGES (badge yang sudah diperoleh user)
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
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  badges: many(userBadges),
  sessions: many(quizSessions),
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
  level: one(levels, {
    fields: [quizzes.levelId],
    references: [levels.id],
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
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  level: one(levels, {
    fields: [userProgress.levelId],
    references: [levels.id],
  }),
}));

export const quizSessionsRelations = relations(
  quizSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [quizSessions.userId],
      references: [users.id],
    }),
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
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

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
