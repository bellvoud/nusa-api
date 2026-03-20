// src/middleware/rateLimiter.ts
//
// Rate limiter berbasis in-memory (Map).
// Untuk production dengan multiple instance, ganti store
// dengan Redis menggunakan @elysiajs/redis atau ioredis.

import { Elysia } from "elysia";

interface RateLimitOptions {
  windowMs: number; // durasi window dalam milidetik
  max: number; // max request per window
  message?: string;
}

interface HitRecord {
  count: number;
  resetAt: number;
}

// ── In-memory store ──────────────────────────────────────────
const store = new Map<string, HitRecord>();

// Bersihkan entri yang sudah expired setiap 5 menit
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) store.delete(key);
    }
  },
  5 * 60 * 1000,
);

// ── Factory: buat plugin rate limiter ───────────────────────
export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = "Terlalu banyak permintaan, coba lagi nanti.",
  } = options;

  return new Elysia({ name: `rateLimiter-${max}-${windowMs}` }).onBeforeHandle(
    { as: "global" },
    ({ request, set }) => {
      // Ambil IP — fallback ke 127.0.0.1 di local/test
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        request.headers.get("x-real-ip") ??
        request.headers.get("cf-connecting-ip") ??
        "127.0.0.1";

      const key = `rl:${ip}:${new URL(request.url).pathname}`;
      const now = Date.now();
      const record = store.get(key);

      if (!record || now > record.resetAt) {
        // Window baru
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        set.headers["X-RateLimit-Limit"] = String(max);
        set.headers["X-RateLimit-Remaining"] = String(max - 1);
        set.headers["X-RateLimit-Reset"] = String(resetAt);
        return; // lanjutkan
      }

      record.count++;
      set.headers["X-RateLimit-Limit"] = String(max);
      set.headers["X-RateLimit-Reset"] = String(record.resetAt);

      if (record.count > max) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        set.headers["Retry-After"] = String(retryAfter);
        set.headers["X-RateLimit-Remaining"] = "0";
        set.status = 429;
        return {
          success: false,
          message,
          errors: [],
        };
      }

      set.headers["X-RateLimit-Remaining"] = String(max - record.count);
    },
  );
};

// ── Preset siap pakai ────────────────────────────────────────

// Auth: 10 request per 15 menit
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Terlalu banyak percobaan, coba lagi dalam 15 menit.",
});

// Gameplay: 30 request per menit
export const gameplayRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Terlalu banyak sesi dibuka, tunggu sebentar.",
});

// Umum (read): 100 request per menit
export const generalRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: "Terlalu banyak permintaan, coba lagi dalam 1 menit.",
});
