// src/tests/api.test.ts
//
// Server di-start otomatis sebelum test dan di-stop setelahnya.
// Cukup jalankan: bun test (tanpa perlu bun dev di terminal lain)

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import app from "../index";

// Server di-start otomatis saat test dimulai
let server: ReturnType<typeof app.listen>;

beforeAll(async () => {
  server = app.listen(3001);
  // Tunggu server siap
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(() => {
  server.stop();
});

const BASE_URL = "http://localhost:3001";

// ── State yang dibagi antar test ─────────────────────────────
let accessToken = "";
let refreshToken = "";
let userId = "";
let sessionId = "";

// Data unik per test run supaya tidak bentrok
const timestamp = Date.now();
const testUser = {
  username: `pejuang_${timestamp}`,
  email: `test_${timestamp}@nusantara.id`,
  password: "TestPassword123!",
};

// ── Helper ───────────────────────────────────────────────────
const req = async (
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle response yang bukan JSON (misal: empty body saat 401/404)
  let json: any = {};
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  return { status: res.status, body: json };
};

// ════════════════════════════════════════════════════════════
// 1. HEALTH CHECK
// ════════════════════════════════════════════════════════════

describe("Health Check", () => {
  it("GET / → returns running message", async () => {
    const { status, body } = await req("GET", "/");
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("running");
  });

  it("GET /health → returns ok status", async () => {
    const { status, body } = await req("GET", "/health");
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════
// 2. AUTH — REGISTER
// ════════════════════════════════════════════════════════════

describe("Auth — Register", () => {
  it("POST /auth/register → berhasil daftar", async () => {
    const { status, body } = await req("POST", "/auth/register", testUser);
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe(testUser.username);
    expect(body.data.access_token).toBeDefined();
    expect(body.data.refresh_token).toBeDefined();
    // Simpan token untuk test berikutnya
    accessToken = body.data.access_token;
    refreshToken = body.data.refresh_token;
    userId = body.data.user.id;
  });

  it("POST /auth/register → email duplikat → 409", async () => {
    const { status, body } = await req("POST", "/auth/register", testUser);
    expect(status).toBe(409);
    expect(body.success).toBe(false);
  });

  it("POST /auth/register → password terlalu pendek → 422", async () => {
    const { status } = await req("POST", "/auth/register", {
      username: `user_pendek_${timestamp}`,
      email: `pendek_${timestamp}@test.com`,
      password: "123",
    });
    // Elysia mengembalikan 422 untuk validation error (format berbeda dari envelope kita)
    expect(status).toBe(422);
  });

  it("POST /auth/register → email tidak valid → 422", async () => {
    const { status } = await req("POST", "/auth/register", {
      username: `user_invalid_${timestamp}`,
      email: "bukan-email",
      password: "Password123!",
    });
    expect(status).toBe(422);
  });
});

// ════════════════════════════════════════════════════════════
// 3. AUTH — LOGIN
// ════════════════════════════════════════════════════════════

describe("Auth — Login", () => {
  it("POST /auth/login → berhasil login", async () => {
    const { status, body } = await req("POST", "/auth/login", {
      email: testUser.email,
      password: testUser.password,
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBeDefined();
    accessToken = body.data.access_token;
    refreshToken = body.data.refresh_token;
  });

  it("POST /auth/login → password salah → 401", async () => {
    const { status, body } = await req("POST", "/auth/login", {
      email: testUser.email,
      password: "WrongPassword!",
    });
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("POST /auth/login → email tidak terdaftar → 401", async () => {
    const { status } = await req("POST", "/auth/login", {
      email: "tidakada@test.com",
      password: "Password123!",
    });
    expect(status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════
// 4. AUTH — ME & REFRESH
// ════════════════════════════════════════════════════════════

describe("Auth — Profile & Token", () => {
  it("GET /auth/me → ambil profil sendiri", async () => {
    const { status, body } = await req(
      "GET",
      "/auth/me",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.email).toBe(testUser.email);
    expect(body.data.passwordHash).toBeUndefined(); // tidak boleh expose hash
  });

  it("GET /auth/me → tanpa token → 401", async () => {
    const { status } = await req("GET", "/auth/me");
    expect(status).toBe(401);
  });

  it("POST /auth/refresh → dapat access token baru", async () => {
    const { status, body } = await req("POST", "/auth/refresh", {
      refresh_token: refreshToken,
    });
    expect(status).toBe(200);
    expect(body.data.access_token).toBeDefined();
    accessToken = body.data.access_token;
    refreshToken = body.data.refresh_token;
  });

  it("POST /auth/refresh → token palsu → 401", async () => {
    const { status } = await req("POST", "/auth/refresh", {
      refresh_token: "token.palsu.banget",
    });
    expect(status).toBe(401);
  });

  it("PATCH /auth/me → update username", async () => {
    const newUsername = `hero_${timestamp}`;
    const { status, body } = await req(
      "PATCH",
      "/auth/me",
      { username: newUsername },
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.username).toBe(newUsername);
  });
});

// ════════════════════════════════════════════════════════════
// 5. MAP — ISLANDS & CHAPTERS
// ════════════════════════════════════════════════════════════

describe("Map — Islands", () => {
  let islandId = "";
  let firstChapterLevelId = "";

  it("GET /map/islands → daftar semua pulau", async () => {
    const { status, body } = await req(
      "GET",
      "/map/islands",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    // Ambil id Pulau Jawa untuk test berikutnya
    const jawa = body.data.find((i: any) => i.slug === "jawa");
    expect(jawa).toBeDefined();
    expect(jawa.isDefaultUnlocked).toBe(true);
    islandId = jawa.id;
  });

  it("GET /map/islands/:id → detail pulau", async () => {
    const { status, body } = await req(
      "GET",
      `/map/islands/${islandId}`,
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.slug).toBe("jawa");
    expect(body.data.chapters).toBeDefined();
  });

  it("GET /map/islands/:id/chapters → daftar chapter beserta level", async () => {
    const { status, body } = await req(
      "GET",
      `/map/islands/${islandId}/chapters`,
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const firstChapter = body.data[0];
    expect(firstChapter.levels).toBeDefined();
    expect(firstChapter.levels.length).toBe(5);

    // Level 1 harus sudah unlock
    const level1 = firstChapter.levels.find((l: any) => l.levelNumber === 1);
    expect(level1.isUnlocked).toBe(true);
    firstChapterLevelId = level1.id;
  });

  it("GET /map/levels/:id → detail level", async () => {
    const { status, body } = await req(
      "GET",
      `/map/levels/${firstChapterLevelId}`,
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.levelNumber).toBe(1);
    expect(body.data.chapter).toBeDefined();
  });

  it("GET /map/islands/id-tidak-ada → 404", async () => {
    const { status } = await req(
      "GET",
      "/map/islands/00000000-0000-0000-0000-000000000000",
      undefined,
      accessToken,
    );
    expect(status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════
// 6. GAMEPLAY — SESSION
// ════════════════════════════════════════════════════════════

describe("Gameplay — Quiz Session", () => {
  let levelId = "";
  let quizQuestions: any[] = [];

  beforeAll(async () => {
    // Ambil level 1 dari chapter pertama Pulau Jawa
    const islandsRes = await req("GET", "/map/islands", undefined, accessToken);
    const jawa = islandsRes.body.data.find((i: any) => i.slug === "jawa");
    const chaptersRes = await req(
      "GET",
      `/map/islands/${jawa.id}/chapters`,
      undefined,
      accessToken,
    );
    levelId = chaptersRes.body.data[0].levels[0].id;
  });

  it("POST /gameplay/sessions/start → buat sesi baru", async () => {
    const { status, body } = await req(
      "POST",
      "/gameplay/sessions/start",
      { level_id: levelId },
      accessToken,
    );
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBeDefined();
    expect(Array.isArray(body.data.questions)).toBe(true);
    expect(body.data.questions.length).toBeGreaterThan(0);

    // Pastikan jawaban benar tidak terekspos
    for (const q of body.data.questions) {
      for (const opt of q.options) {
        expect(opt.isCorrect).toBeUndefined();
      }
    }

    sessionId = body.data.sessionId;
    quizQuestions = body.data.questions;
  });

  it("POST /gameplay/sessions/start → level yang sama → 409 (sesi aktif)", async () => {
    const { status, body } = await req(
      "POST",
      "/gameplay/sessions/start",
      { level_id: levelId },
      accessToken,
    );
    expect(status).toBe(409);
    expect(body.success).toBe(false);
  });

  it("POST /gameplay/sessions/:id/submit → submit jawaban", async () => {
    // Buat jawaban (pilih option pertama untuk setiap soal)
    const answers = quizQuestions.map((q: any) => ({
      quiz_id: q.id,
      selected_option_id: q.options[0]?.id,
    }));

    const { status, body } = await req(
      "POST",
      `/gameplay/sessions/${sessionId}/submit`,
      { answers, time_spent_sec: 120 },
      accessToken,
    );

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.score).toBeDefined();
    expect(typeof body.data.score).toBe("number");
    expect(body.data.score).toBeGreaterThanOrEqual(0);
    expect(body.data.score).toBeLessThanOrEqual(100);
    expect(body.data.xpGained).toBeGreaterThan(0);
    expect(Array.isArray(body.data.answerBreakdown)).toBe(true);
    expect(Array.isArray(body.data.newBadges)).toBe(true);
  });

  it("GET /gameplay/sessions/:id → ambil detail sesi selesai", async () => {
    const { status, body } = await req(
      "GET",
      `/gameplay/sessions/${sessionId}`,
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.isCompleted).toBe(true);
    expect(body.data.score).toBeDefined();
  });

  it("POST /gameplay/sessions/:id/submit → sesi sudah selesai → 404", async () => {
    const { status } = await req(
      "POST",
      `/gameplay/sessions/${sessionId}/submit`,
      { answers: [], time_spent_sec: 0 },
      accessToken,
    );
    expect(status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════
// 7. BADGES & PROGRESS
// ════════════════════════════════════════════════════════════

describe("Badges & Progress", () => {
  it("GET /badges → katalog semua badge", async () => {
    const { status, body } = await req(
      "GET",
      "/badges",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const firstBadge = body.data[0];
    expect(firstBadge.id).toBeDefined();
    expect(firstBadge.name).toBeDefined();
    expect(firstBadge.isOwned).toBeDefined();
  });

  it("GET /users/me/badges → badge yang dimiliki user", async () => {
    const { status, body } = await req(
      "GET",
      "/users/me/badges",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.totalBadges).toBeDefined();
    expect(Array.isArray(body.data.badges)).toBe(true);
    // totalBadges >= 0 (badge hanya diberikan jika lulus, nilai tergantung jawaban)
    expect(body.data.totalBadges).toBeGreaterThanOrEqual(0);
  });

  it("GET /users/me/badges/upcoming → badge yang hampir unlock", async () => {
    const { status, body } = await req(
      "GET",
      "/users/me/badges/upcoming",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      expect(body.data[0].progressPercent).toBeDefined();
      expect(body.data[0].progressLabel).toBeDefined();
    }
  });

  it("GET /users/me/progress → progress lengkap", async () => {
    const { status, body } = await req(
      "GET",
      "/users/me/progress",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.user).toBeDefined();
    expect(body.data.stats).toBeDefined();
    expect(body.data.user.xpInCurrentLevel).toBeDefined();
    expect(body.data.user.levelProgressPercent).toBeDefined();
    // levelsCompleted >= 0 (tergantung apakah skor test mencapai minScoreToPass)
    expect(body.data.stats.levelsCompleted).toBeGreaterThanOrEqual(0);
    // Tapi attempts pasti > 0 karena kita sudah submit session
    expect(body.data.stats.totalAttempts).toBeGreaterThanOrEqual(1);
  });

  it("GET /users/leaderboard → top 50", async () => {
    const { status, body } = await req(
      "GET",
      "/users/leaderboard",
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(Array.isArray(body.data.leaderboard)).toBe(true);
    expect(body.data.leaderboard.length).toBeGreaterThan(0);
    // currentUserRank tersedia meski user tidak masuk top 50
    expect(body.data.currentUserRank).toBeDefined();
  });

  it("GET /users/:id/profile → profil publik", async () => {
    const { status, body } = await req(
      "GET",
      `/users/${userId}/profile`,
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.id).toBe(userId);
    expect(body.data.stats).toBeDefined();
    // Pastikan data sensitif tidak terekspos
    expect(body.data.email).toBeUndefined();
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("GET /badges/:id → detail badge", async () => {
    const allBadges = await req("GET", "/badges", undefined, accessToken);
    const firstBadgeId = allBadges.body.data[0].id;

    const { status, body } = await req(
      "GET",
      `/badges/${firstBadgeId}`,
      undefined,
      accessToken,
    );
    expect(status).toBe(200);
    expect(body.data.id).toBe(firstBadgeId);
    expect(body.data.criteriaType).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════
// 8. RATE LIMITER
// ════════════════════════════════════════════════════════════

describe("Rate Limiter", () => {
  it("rate limiter aktif — header X-RateLimit-Limit tersedia", async () => {
    // Verifikasi rate limiter berjalan dengan cek header response
    // Lebih efisien daripada kirim 100+ request ke Supabase
    const res = await fetch(`${BASE_URL}/map/islands`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    // Rate limiter harus menyertakan header ini di setiap response
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
    expect(Number(res.headers.get("X-RateLimit-Remaining"))).toBeLessThan(100);
  });
});
