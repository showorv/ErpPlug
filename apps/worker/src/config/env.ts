import { z } from "zod";

/**
 * Every environment variable the worker reads, validated once at start-up.
 * It shares REDIS_URL, NODE_ENV and LOG_LEVEL with the API (same root .env file).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** Jobs each queue processes at the same time in one worker process. */
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
  /** Redis key prefix for all queues, so ErpPlug never collides with other users of the Redis. */
  QUEUE_PREFIX: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits and dashes.")
    .default("erpplug"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${problems}\nCopy .env.example to .env at the repo root and fill it in.`,
    );
  }
  return result.data;
}
