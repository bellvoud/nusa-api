// src/modules/auth/auth.routes.ts
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
} from "./auth.schema";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
} from "./auth.service";
import { ok, created, fail } from "../../utils/response";

// ── JWT plugins ──────────────────────────────────────────────
const jwtAccessPlugin = jwt({
  name: "jwtAccess",
  secret: process.env.JWT_SECRET!,
  exp: process.env.JWT_EXPIRES_IN ?? "15m",
});

const jwtRefreshPlugin = jwt({
  name: "jwtRefresh",
  secret: process.env.JWT_SECRET! + "_refresh",
  exp: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
});

// ── Auth middleware (standalone, bisa dipakai modul lain) ────
// Pakai nama unik supaya Elysia tidak deduplikasi plugin ini
export const authMiddleware = new Elysia({ name: "authMiddleware" })
  .use(
    jwt({
      name: "jwtAccess",
      secret: process.env.JWT_SECRET!,
      exp: process.env.JWT_EXPIRES_IN ?? "15m",
    }),
  )
  .use(bearer())
  .derive({ as: "global" }, async ({ jwtAccess, bearer, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("UNAUTHORIZED");
    }
    const payload = await jwtAccess.verify(bearer);
    if (!payload) {
      set.status = 401;
      throw new Error("UNAUTHORIZED");
    }
    return { userId: payload.sub as string };
  });

// ── Public auth routes (/auth/register, /auth/login, /auth/refresh) ──
export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtAccessPlugin)
  .use(jwtRefreshPlugin)
  .use(bearer())

  // POST /auth/register
  .post(
    "/register",
    async ({ body, jwtAccess, jwtRefresh, set }) => {
      try {
        const user = await registerUser(body);
        const access_token = await jwtAccess.sign({ sub: user.id });
        const refresh_token = await jwtRefresh.sign({ sub: user.id });
        set.status = 201;
        return created(
          { user, access_token, refresh_token },
          "Registrasi berhasil",
        );
      } catch (e: any) {
        set.status = 409;
        const message =
          e.message === "EMAIL_TAKEN"
            ? "Email sudah digunakan"
            : e.message === "USERNAME_TAKEN"
              ? "Username sudah digunakan"
              : "Registrasi gagal";
        return fail(message);
      }
    },
    {
      body: registerSchema,
      detail: { tags: ["Auth"], summary: "Register akun baru" },
    },
  )

  // POST /auth/login
  .post(
    "/login",
    async ({ body, jwtAccess, jwtRefresh, set }) => {
      try {
        const user = await loginUser(body);
        const access_token = await jwtAccess.sign({ sub: user.id });
        const refresh_token = await jwtRefresh.sign({ sub: user.id });
        return ok({ user, access_token, refresh_token }, "Login berhasil");
      } catch {
        set.status = 401;
        return fail("Email atau password salah");
      }
    },
    {
      body: loginSchema,
      detail: { tags: ["Auth"], summary: "Login dan dapatkan token" },
    },
  )

  // POST /auth/refresh
  .post(
    "/refresh",
    async ({ body, jwtAccess, jwtRefresh, set }) => {
      const payload = await jwtRefresh.verify(body.refresh_token);
      if (!payload) {
        set.status = 401;
        return fail("Refresh token tidak valid atau sudah expired");
      }
      const access_token = await jwtAccess.sign({ sub: payload.sub });
      const new_refresh_token = await jwtRefresh.sign({ sub: payload.sub });
      return ok(
        { access_token, refresh_token: new_refresh_token },
        "Token diperbarui",
      );
    },
    {
      body: refreshSchema,
      detail: { tags: ["Auth"], summary: "Refresh access token" },
    },
  );

// ── Protected auth routes (/auth/me) ─────────────────────────
export const authMeRoutes = new Elysia({ prefix: "/auth" })
  .use(authMiddleware)

  // GET /auth/me
  .get(
    "/me",
    async ({ userId, set }) => {
      try {
        const user = await getUserById(userId);
        return ok(user);
      } catch {
        set.status = 404;
        return fail("User tidak ditemukan");
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Ambil profil user yang sedang login",
      },
    },
  )

  // PATCH /auth/me
  .patch(
    "/me",
    async ({ userId, body, set }) => {
      try {
        const updated = await updateUserProfile(userId, {
          username: body.username,
          avatarUrl: body.avatar_url,
        });
        return ok(updated, "Profil berhasil diperbarui");
      } catch (e: any) {
        set.status = e.message === "USERNAME_TAKEN" ? 409 : 400;
        return fail(
          e.message === "USERNAME_TAKEN"
            ? "Username sudah digunakan"
            : "Gagal memperbarui profil",
        );
      }
    },
    {
      body: updateProfileSchema,
      detail: { tags: ["Auth"], summary: "Update username atau avatar" },
    },
  );
