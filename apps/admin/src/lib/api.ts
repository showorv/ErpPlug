/**
 * Minimal API client. Calls go to /api on the same origin (Vite proxies to NestJS in development).
 * Errors arrive in the standard shape from @erpplug/contracts and are thrown as ApiError.
 * The generated, typed client in packages/sdk replaces this in Phase 1.
 */
import {
  ERROR_CODES,
  isApiErrorBody,
  type ValidationIssue,
  isValidationIssueList,
} from "@erpplug/contracts";

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

  /** Per-field problems for VALIDATION_FAILED / INVALID_QUERY errors, otherwise empty. */
  get issues(): ValidationIssue[] {
    return isValidationIssueList(this.details) ? this.details : [];
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
    throw new ApiError(0, ERROR_CODES.NETWORK_ERROR, "The server could not be reached.");
  }

  if (res.ok) return (await res.json()) as T;

  const body: unknown = await res.json().catch(() => null);
  if (isApiErrorBody(body)) {
    const e = body.error;
    throw new ApiError(e.status, e.code, e.message, e.requestId, e.details);
  }
  throw new ApiError(res.status, `HTTP_${res.status}`, res.statusText || "Request failed");
}
