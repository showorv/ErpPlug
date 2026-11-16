/** Header names shared by the API and its clients. HTTP header names are case-insensitive. */
export const HEADERS = {
  /** Correlates a request across logs. The API echoes the client's value or generates one. */
  requestId: "x-request-id",
  /** Makes a POST safe to retry: the same key returns the first result instead of acting twice. */
  idempotencyKey: "idempotency-key",
} as const;

/** All versioned endpoints live under this prefix: `/api/v1/{module}/...`. */
export const API_V1_PREFIX = "/api/v1";
