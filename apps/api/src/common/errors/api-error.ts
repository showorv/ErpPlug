import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * The one error shape every API response uses (BRD 13, "consistent error format").
 * Will move to packages/contracts in Phase 0 days 7-8 so the React apps share it.
 */
export interface ApiErrorBody {
  error: {
    /** HTTP status code, repeated in the body for clients that only see the body. */
    status: number;
    /** Stable, machine-readable code. Clients branch on this, never on `message`. */
    code: string;
    /** Human-readable message, safe to show to the user. */
    message: string;
    /** Optional extra data, e.g. per-field validation errors. */
    details?: unknown;
    /** Same value as the `x-request-id` response header; quote it in bug reports. */
    requestId: string;
    path: string;
    timestamp: string;
  };
}

/** Default code for each HTTP status when the thrower does not give one. */
export const DEFAULT_ERROR_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHENTICATED",
  [HttpStatus.PAYMENT_REQUIRED]: "PAYMENT_REQUIRED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.METHOD_NOT_ALLOWED]: "METHOD_NOT_ALLOWED",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "PAYLOAD_TOO_LARGE",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "VALIDATION_FAILED",
  [HttpStatus.TOO_MANY_REQUESTS]: "RATE_LIMITED",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_ERROR",
  [HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE",
};

/**
 * Throw this from any controller or service to return a specific code and details:
 *   throw new ApiException(HttpStatus.CONFLICT, "sales.QUOTATION_LOCKED", "This quotation is already confirmed.");
 * Module-specific codes start with the module key (rule R7).
 */
export class ApiException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string, details?: unknown) {
    super({ code, message, details }, status);
  }
}
