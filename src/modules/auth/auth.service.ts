// src/modules/auth/auth.service.ts
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { calculateLevel } from "../../utils/xp";

// ── Hash password menggunakan Bun built-in ──────────────────
export const hashPassword = async (password: string): Promise<string> => {
  return Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
};

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return Bun.password.verify(password, hash);
};

// ── Register ────────────────────────────────────────────────
export const registerUser = async (input: {
  username: string;
  email: string;
  password: string;
}) => {
  // Cek email sudah dipakai
  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (existingEmail) {
    throw new Error("EMAIL_TAKEN");
  }

  // Cek username sudah dipakai
  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, input.username),
  });
  if (existingUsername) {
    throw new Error("USERNAME_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      passwordHash,
    })
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      totalXp: users.totalXp,
      level: users.level,
      createdAt: users.createdAt,
    });

  return user;
};

// ── Login ───────────────────────────────────────────────────
export const loginUser = async (input: { email: string; password: string }) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Update last login & streak
  const now = new Date();
  const lastLogin = user.lastLoginAt;
  let newStreak = user.loginStreak;

  if (lastLogin) {
    const diffDays = Math.floor(
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) {
      newStreak += 1; // login hari berturut-turut
    } else if (diffDays > 1) {
      newStreak = 1; // streak putus
    }
  } else {
    newStreak = 1;
  }

  await db
    .update(users)
    .set({ lastLoginAt: now, loginStreak: newStreak, updatedAt: now })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    totalXp: user.totalXp,
    level: user.level,
    loginStreak: newStreak,
  };
};

// ── Get profile ─────────────────────────────────────────────
export const getUserById = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      passwordHash: false, // jangan expose hash
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

// ── Update profile ───────────────────────────────────────────
export const updateUserProfile = async (
  id: string,
  input: { username?: string; avatarUrl?: string },
) => {
  if (input.username) {
    const existing = await db.query.users.findFirst({
      where: eq(users.username, input.username),
    });
    if (existing && existing.id !== id) {
      throw new Error("USERNAME_TAKEN");
    }
  }

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (input.username) updateData.username = input.username;
  if (input.avatarUrl) updateData.avatarUrl = input.avatarUrl;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      avatarUrl: users.avatarUrl,
      totalXp: users.totalXp,
      level: users.level,
    });

  if (!updated) throw new Error("USER_NOT_FOUND");
  return updated;
};
