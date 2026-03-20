# 🗺️ NusaQuest API

REST API untuk platform edutainment interaktif bertema sejarah Indonesia. Dibangun dengan **Elysia JS**, **Bun**, **Drizzle ORM**, dan **Supabase (PostgreSQL)**.

## ✨ Fitur

- 🔐 **Auth** — Register, login, JWT access + refresh token, update profil
- 🗺️ **Map & Chapter** — Peta interaktif pulau, chapter per region, 5 level per chapter
- 🧠 **Quiz & Gameplay** — Sesi quiz, submit jawaban, penilaian otomatis, unlock level
- 🏆 **Badge & Progress** — Achievement system, XP, leaderboard, badge criteria engine
- 🛡️ **Rate Limiter** — Proteksi endpoint dari abuse berbasis IP
- 📖 **Swagger UI** — Dokumentasi API interaktif di `/docs`

---

## 🛠️ Tech Stack

| Komponen    | Teknologi                                     |
| ----------- | --------------------------------------------- |
| Runtime     | [Bun](https://bun.sh)                         |
| Framework   | [Elysia JS](https://elysiajs.com)             |
| Database    | [Supabase](https://supabase.com) (PostgreSQL) |
| ORM         | [Drizzle ORM](https://orm.drizzle.team)       |
| Auth        | JWT (`@elysiajs/jwt`)                         |
| Dokumentasi | Swagger (`@elysiajs/swagger`)                 |

---

## 📁 Struktur Project

```
nusantara-quest-api/
├── src/
│   ├── index.ts                    # Entry point
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (semua tabel + relasi)
│   │   ├── index.ts                # Koneksi Supabase
│   │   └── seed.ts                 # Seed data awal
│   ├── modules/
│   │   ├── auth/                   # Register, login, refresh, profil
│   │   ├── map/                    # Islands, chapters, levels
│   │   ├── gameplay/               # Quiz session, submit, result
│   │   └── badges/                 # Badge, progress, leaderboard
│   ├── middleware/
│   │   └── rateLimiter.ts          # Rate limiter in-memory
│   ├── utils/
│   │   ├── response.ts             # Helper envelope response
│   │   ├── xp.ts                   # Kalkulasi XP & level
│   │   └── badgeEngine.ts          # Badge criteria engine
│   └── tests/
│       └── api.test.ts             # 32 test case end-to-end
├── drizzle/
│   └── migrations/                 # Auto-generated migrations
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🚀 Cara Menjalankan

### 1. Prasyarat

- [Bun](https://bun.sh) versi terbaru
- Akun [Supabase](https://supabase.com) dengan project aktif

### 2. Clone & Install

```bash
git clone https://github.com/username/nusa-api.git
cd nusa-api
bun install
```

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env` lalu isi dengan kredensial Supabase:

```bash
cp .env.example .env
```

```env
# Supabase — Transaction pooler (port 6543) untuk runtime
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase — Session pooler (port 5432) untuk migration
DATABASE_URL_MIGRATION=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# JWT Secret — minimal 32 karakter random
JWT_SECRET=ganti_dengan_string_random_panjang

PORT=3000
NODE_ENV=development
```

> **Cara mendapatkan connection string Supabase:**
> Dashboard → Project Settings → Database → Connection string → URI

### 4. Setup Database

```bash
# Buat semua tabel di Supabase
bun db:push

# Isi data awal (pulau, chapter, level, quiz, badge)
bun db:seed
```

### 5. Jalankan Server

```bash
bun dev
```

Server berjalan di `http://localhost:3000`
Swagger docs di `http://localhost:3000/docs`

---

## 📜 Scripts

| Script             | Perintah          | Fungsi                           |
| ------------------ | ----------------- | -------------------------------- |
| Development        | `bun dev`         | Server dengan hot-reload         |
| Production         | `bun start`       | Server tanpa hot-reload          |
| Generate migration | `bun db:generate` | Buat file migration dari schema  |
| Push schema        | `bun db:push`     | Sync schema langsung ke database |
| Seed data          | `bun db:seed`     | Isi data awal                    |
| Drizzle Studio     | `bun db:studio`   | GUI database browser             |
| Test               | `bun test`        | Jalankan 32 test case            |

---

## 📡 API Endpoints

Base URL: `http://localhost:3000`

### 🔐 Auth

| Method  | Endpoint         | Auth | Deskripsi                           |
| ------- | ---------------- | :--: | ----------------------------------- |
| `POST`  | `/auth/register` |  —   | Daftar akun baru                    |
| `POST`  | `/auth/login`    |  —   | Login, dapat access + refresh token |
| `POST`  | `/auth/refresh`  |  —   | Refresh access token                |
| `GET`   | `/auth/me`       |  ✅  | Profil user yang sedang login       |
| `PATCH` | `/auth/me`       |  ✅  | Update username atau avatar         |

### 🗺️ Map

| Method | Endpoint                    | Auth | Deskripsi                     |
| ------ | --------------------------- | :--: | ----------------------------- |
| `GET`  | `/map/islands`              |  ✅  | Daftar semua pulau + progress |
| `GET`  | `/map/islands/:id`          |  ✅  | Detail satu pulau             |
| `GET`  | `/map/islands/:id/chapters` |  ✅  | Chapter & level di pulau ini  |
| `GET`  | `/map/levels/:id`           |  ✅  | Detail level + status user    |

### 🧠 Gameplay

| Method | Endpoint                         | Auth | Deskripsi                 |
| ------ | -------------------------------- | :--: | ------------------------- |
| `POST` | `/gameplay/sessions/start`       |  ✅  | Mulai sesi quiz baru      |
| `GET`  | `/gameplay/sessions/:id`         |  ✅  | Detail sesi aktif/selesai |
| `POST` | `/gameplay/sessions/:id/submit`  |  ✅  | Submit semua jawaban      |
| `POST` | `/gameplay/sessions/:id/abandon` |  ✅  | Batalkan sesi aktif       |

### 🏆 Badge & Progress

| Method | Endpoint                    | Auth | Deskripsi                |
| ------ | --------------------------- | :--: | ------------------------ |
| `GET`  | `/badges`                   |  ✅  | Katalog semua badge      |
| `GET`  | `/badges/:id`               |  ✅  | Detail satu badge        |
| `GET`  | `/users/me/badges`          |  ✅  | Badge milik user         |
| `GET`  | `/users/me/badges/upcoming` |  ✅  | Badge yang hampir unlock |
| `GET`  | `/users/me/progress`        |  ✅  | Progress lengkap + XP    |
| `GET`  | `/users/leaderboard`        |  ✅  | Top 50 pemain            |
| `GET`  | `/users/:id/profile`        |  ✅  | Profil publik user lain  |

---

## 🔑 Autentikasi

API menggunakan **JWT Bearer Token**. Sertakan token di header setiap request yang membutuhkan auth:

```
Authorization: Bearer <access_token>
```

Access token berlaku selama **15 menit**. Gunakan refresh token untuk mendapatkan access token baru:

```bash
POST /auth/refresh
{
  "refresh_token": "<refresh_token>"
}
```

---

## 📦 Format Response

Semua response menggunakan format envelope yang konsisten:

```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

Response error:

```json
{
  "success": false,
  "message": "Pesan error",
  "errors": []
}
```

### HTTP Status Codes

| Code  | Arti                                     |
| ----- | ---------------------------------------- |
| `200` | OK                                       |
| `201` | Created                                  |
| `400` | Bad request                              |
| `401` | Unauthorized (token tidak valid/expired) |
| `403` | Forbidden (level belum terbuka)          |
| `404` | Not found                                |
| `409` | Conflict (duplikat data / sesi aktif)    |
| `422` | Validation error                         |
| `429` | Rate limit exceeded                      |
| `500` | Internal server error                    |

---

## 🛡️ Rate Limiting

| Endpoint                          | Limit                 |
| --------------------------------- | --------------------- |
| `/auth/*`                         | 10 request / 15 menit |
| `/gameplay/*`                     | 30 request / menit    |
| `/map/*`, `/badges/*`, `/users/*` | 100 request / menit   |

Response header saat rate limit aktif:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000000
Retry-After: 45  (hanya saat 429)
```

---

## 🗄️ Skema Database

### Tabel Utama

| Tabel             | Deskripsi                                           |
| ----------------- | --------------------------------------------------- |
| `users`           | Akun pengguna, XP, level, login streak              |
| `islands`         | Data pulau + koordinat peta                         |
| `chapters`        | Titik pada peta (region sejarah)                    |
| `levels`          | 5 level per chapter + era periode                   |
| `quizzes`         | Soal quiz (multiple choice, true/false, fill blank) |
| `quiz_options`    | Pilihan jawaban                                     |
| `user_progress`   | Status unlock & skor terbaik per level per user     |
| `quiz_sessions`   | Rekaman setiap sesi bermain                         |
| `session_answers` | Jawaban per soal dalam satu sesi                    |
| `badges`          | Katalog achievement                                 |
| `user_badges`     | Badge yang dimiliki user                            |

### Relasi Utama

```
islands → chapters → levels → quizzes → quiz_options
users → user_progress → levels
users → quiz_sessions → session_answers
users → user_badges → badges
```

---

## 🧪 Testing

Test menggunakan **Bun test runner** (built-in, tidak perlu library tambahan).

```bash
bun test
```

Server di-start otomatis sebelum test berjalan — tidak perlu menjalankan `bun dev` secara terpisah.

**32 test case** mencakup:

- Health check
- Auth (register, login, refresh, profil)
- Map (islands, chapters, levels)
- Gameplay (start session, submit, result)
- Badge & progress
- Rate limiter

---

## 🎮 Alur Gameplay

```
1. User register / login  →  dapat JWT token
2. GET /map/islands       →  pilih pulau (Jawa unlock default)
3. GET /map/islands/:id/chapters  →  pilih chapter & level
4. POST /gameplay/sessions/start  →  mulai quiz, dapat soal-soal
5. [User menjawab soal di frontend]
6. POST /gameplay/sessions/:id/submit  →  kirim jawaban
7. Hasil: skor, XP, badge baru, level berikutnya terbuka
```

---

## 🏅 Badge Criteria Engine

Badge diberikan otomatis setelah setiap sesi quiz selesai. Criteria yang tersedia:

| Criteria             | Contoh Badge                                       |
| -------------------- | -------------------------------------------------- |
| `levels_completed`   | Penjelajah Pertama (1 level), Petualang (10 level) |
| `chapters_completed` | Penguasa Chapter                                   |
| `islands_completed`  | Penakluk Nusantara                                 |
| `perfect_score`      | Nilai Sempurna (skor 100)                          |
| `total_xp`           | Cendekiawan (1000 XP), Mahaguru (5000 XP)          |
| `login_streak`       | Konsisten 3/7/30 Hari                              |
| `badges_collected`   | Kolektor Badge                                     |

Untuk menambah criteria baru, cukup tambahkan satu entri di `criteriaEvaluators` di `src/utils/badgeEngine.ts`.

---

## 🌍 Konten Sejarah (Seed Data)

Data awal mencakup **5 pulau**, **8 chapter**, **10 level**, **25 soal quiz**, dan **11 badge**:

| Pulau      | Chapter            | Tema                        |
| ---------- | ------------------ | --------------------------- |
| Jawa       | Jawa Tengah        | Kerajaan Mataram Islam      |
| Jawa       | Jawa Timur         | Kerajaan Majapahit          |
| Sumatera   | Sumatera Selatan   | Kerajaan Sriwijaya          |
| Sumatera   | Aceh               | Kesultanan Aceh Darussalam  |
| Kalimantan | Kalimantan Timur   | Kerajaan Kutai              |
| Kalimantan | Kalimantan Selatan | Kesultanan Banjar           |
| Sulawesi   | Sulawesi Selatan   | Kerajaan Gowa-Tallo         |
| Maluku     | Maluku Tengah      | Kesultanan Ternate & Tidore |

---

## 📄 Lisensi

MIT License — bebas digunakan untuk keperluan edukasi dan pengembangan.
