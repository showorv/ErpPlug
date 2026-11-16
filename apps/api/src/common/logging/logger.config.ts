import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { HEADERS } from "@erpplug/contracts";
import type { Params } from "nestjs-pino";
import type { Env } from "../../config/env";

const REQUEST_ID_HEADER = HEADERS.requestId;

/**
 * Structured JSON logs via pino. Every line carries the request id; tenant and module ids are
 * added once the tenant resolver exists (Phase 1), so logs can be filtered per tenant (NFR-15).
 */
export function buildLoggerParams(env: Pick<Env, "NODE_ENV" | "LOG_LEVEL">): Params {
  return {
    pinoHttp: {
      level: env.LOG_LEVEL,
      // Pretty, coloured output for local development; raw JSON everywhere else.
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { singleLine: true, translateTime: "SYS:HH:MM:ss" } }
          : undefined,
      // Reuse the caller's request id when it looks safe, otherwise make one. Echo it back.
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const incoming = req.headers[REQUEST_ID_HEADER];
        const id =
          typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
        res.setHeader(REQUEST_ID_HEADER, id);
        return id;
      },
      // Never write credentials to logs.
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
        censor: "[redacted]",
      },
      customProps: () => ({ service: "api" }),
      // Health checks are polled constantly; keep them out of the logs.
      autoLogging: { ignore: (req) => req.url === "/api/health" },
    },
  };
}
