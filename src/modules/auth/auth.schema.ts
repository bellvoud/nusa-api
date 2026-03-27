// src/modules/auth/auth.schema.ts
import { t } from "elysia";

export const registerSchema = t.Object({
  username: t.String({ minLength: 3, maxLength: 50 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8, maxLength: 100 }),
});

export const loginSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const refreshSchema = t.Object({
  refresh_token: t.String(),
});

export const updateProfileSchema = t.Object({
  username: t.Optional(t.String({ minLength: 3, maxLength: 50 })),
  avatar_url: t.Optional(t.String()),
});
