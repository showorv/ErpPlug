/**
 * Minimal API client. Calls go to /api on the same origin (Vite proxies to NestJS in development).
 * The error type mirrors the API's standard error format; both move to packages/contracts and
 * packages/sdk in Phase 0 days 7-8 / Phase 1.
 */
export interface ApiErrorBody {
  error: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    path: string;
    timestamp: string;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      credentials: "include",
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "The server could not be reached.");
  }

  if (res.ok) return (await res.json()) as T;

  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  if (body?.error) {
    const e = body.error;
    throw new ApiError(e.status, e.code, e.message, e.requestId, e.details);
  }
  throw new ApiError(res.status, `HTTP_${res.status}`, res.statusText || "Request failed");
}
