/**
 * The one error shape every API response uses (BRD 13, "consistent error format").
 *
 *   HTTP/1.1 404 Not Found
 *   x-request-id: 0b6c...
 *   { "error": { "status": 404, "code": "NOT_FOUND", "message": "...", "requestId": "0b6c...", ... } }
 *
 * Clients branch on `code`, never on `message` (messages are for people and may be translated).
 */
export interface ApiErrorBody {
  error: {
    /** HTTP status code, repeated in the body for clients that only see the body. */
    status: number;
    /** Stable, machine-readable code: one of {@link ERROR_CODES} or a module code like `sales.QUOTATION_LOCKED`. */
    code: string;
    /** Human-readable message, safe to show to the user. */
    message: string;
    /** Extra data. For `VALIDATION_FAILED` and `INVALID_QUERY` it is a {@link ValidationIssue} list. */
    details?: unknown;
    /** Same value as the `x-request-id` response header; quote it in bug reports. */
    requestId: string;
    path: string;
    /** ISO 8601 time the error was produced. */
    timestamp: string;
  };
}

/** One problem with one input field. `path` uses dots: `lines.0.quantity`, `filter.status`. */
export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Platform-wide error codes. Modules add their own codes prefixed with the module key
 * (rule R7), e.g. `sales.QUOTATION_LOCKED`, and never reuse these names for other meanings.
 */
export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  /** A list endpoint got a page, sort, filter or search parameter it does not accept. */
  INVALID_QUERY: "INVALID_QUERY",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  /** The tenant's plan does not include this feature, or the subscription is not active. */
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  /** Client-side only: the request never reached the server. */
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export type PlatformErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const DEFAULT_CODE_BY_STATUS: Readonly<Record<number, PlatformErrorCode>> = {
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHENTICATED,
  402: ERROR_CODES.PAYMENT_REQUIRED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  405: ERROR_CODES.METHOD_NOT_ALLOWED,
  409: ERROR_CODES.CONFLICT,
  413: ERROR_CODES.PAYLOAD_TOO_LARGE,
  422: ERROR_CODES.VALIDATION_FAILED,
  429: ERROR_CODES.RATE_LIMITED,
  500: ERROR_CODES.INTERNAL_ERROR,
  503: ERROR_CODES.SERVICE_UNAVAILABLE,
};

/** The code to use when the thrower did not give one. Unknown statuses become `HTTP_<status>`. */
export function defaultErrorCode(status: number): string {
  return DEFAULT_CODE_BY_STATUS[status] ?? `HTTP_${status}`;
}

/** True when a parsed response body has the standard error shape. */
export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const e = (value as { error: unknown }).error;
  return (
    typeof e === "object" &&
    e !== null &&
    typeof (e as Record<string, unknown>).status === "number" &&
    typeof (e as Record<string, unknown>).code === "string" &&
    typeof (e as Record<string, unknown>).message === "string"
  );
}

/** True when `details` is a list of field issues (VALIDATION_FAILED / INVALID_QUERY). */
export function isValidationIssueList(details: unknown): details is ValidationIssue[] {
  return (
    Array.isArray(details) &&
    details.every(
      (d) =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as ValidationIssue).path === "string" &&
        typeof (d as ValidationIssue).message === "string",
    )
  );
}
