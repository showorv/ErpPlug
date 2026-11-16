import type { QueueOptions } from "bullmq";
import type { Env } from "../config/env";

/**
 * Connection and job defaults shared by every queue. The API uses the same settings when it
 * starts producing jobs, so both sides agree on the Redis prefix.
 */
export function buildQueueOptions(env: Pick<Env, "REDIS_URL" | "QUEUE_PREFIX">): QueueOptions {
  return {
    // maxRetriesPerRequest: null is required by BullMQ for blocking worker connections.
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    prefix: env.QUEUE_PREFIX,
    defaultJobOptions: {
      // A failing job is retried twice more, waiting 5s then 10s.
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      // Keep recent history for debugging without letting Redis grow forever.
      removeOnComplete: { age: 24 * 3600, count: 1_000 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  };
}
