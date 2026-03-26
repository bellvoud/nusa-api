import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes, authMeRoutes } from "./modules/auth/auth.routes";
import { mapRoutes } from "./modules/map/map.routes";
import { gameplayRoutes } from "./modules/gameplay/gameplay.routes";
import { badgesRoutes } from "./modules/badges/badges.routes";
import {
  authRateLimit,
  gameplayRateLimit,
  generalRateLimit,
} from "./middleware/rateLimiter";

const app = new Elysia()
  .use(
    cors({
      origin:
        process.env.NODE_ENV === "development" ? "*" : ["https://nusaquest.id"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Nusantara Quest API",
          version: "1.0.0",
          description:
            "REST API for Nusantara Quest — Interactive History Edutainment Game",
        },
        tags: [
          { name: "Auth", description: "Authentication & user management" },
          { name: "Map", description: "Islands, chapters & levels" },
          { name: "Gameplay", description: "Quiz sessions & results" },
          { name: "Badges", description: "Achievements & progress" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
      path: "/docs",
    }),
  )
  // Suppress Elysia default error logging — error sudah ditangani di masing-masing route
  .onError(({ error, code, set }) => {
    // 4xx errors adalah kondisi normal, tidak perlu di-log
    const status = set.status ?? 500;
    if (Number(status) >= 500) {
      console.error(`[${code}]`, error.message);
    }
  })
  .get("/", () => ({
    success: true,
    message: "🗺️ Nusantara Quest API is running!",
    version: "1.0.0",
    docs: "/docs",
  }))
  .get("/health", () => ({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  // modules w/ rate limiter
  .use(authRateLimit)
  .use(authRoutes)
  .use(authMeRoutes)
  .use(generalRateLimit)
  .use(mapRoutes)
  .use(gameplayRateLimit)
  .use(gameplayRoutes)
  .use(generalRateLimit)
  .use(badgesRoutes);

app.onError(({ error, code, set }) => {
  const status = set.status ?? 500;
  if (Number(status) >= 500) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error(`[${code}]`, message);
  }
});

// local
if (import.meta.main || process.env.NODE_ENV === "development") {
  app.listen(process.env.PORT ?? 3000);
  console.log(
    `🗺️ Nusantara Quest API running at http://localhost:${app.server?.port}`,
  );
  console.log(`📖 Swagger docs at http://localhost:${app.server?.port}/docs`);
}

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const PATCH = app.handle;
export const DELETE = app.handle;

export default app;
export type App = typeof app;
