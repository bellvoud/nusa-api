// src/utils/response.ts

export const ok = <T>(data: T, message?: string) => ({
  success: true,
  message: message ?? "OK",
  data,
});

export const created = <T>(data: T, message?: string) => ({
  success: true,
  message: message ?? "Created",
  data,
});

export const paginated = <T>(
  data: T[],
  meta: { page: number; limit: number; total: number },
) => ({
  success: true,
  data,
  meta: {
    ...meta,
    totalPages: Math.ceil(meta.total / meta.limit),
    hasNext: meta.page * meta.limit < meta.total,
    hasPrev: meta.page > 1,
  },
});

export const fail = (message: string, errors?: Record<string, string>[]) => ({
  success: false,
  message,
  errors: errors ?? [],
});
