import "reflect-metadata";
import { getQueueToken } from "@nestjs/bullmq";
import { Test, type TestingModule } from "@nestjs/testing";
import { Queue, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildQueueOptions } from "../src/queues/queue-options";
import { SystemProcessor } from "../src/queues/system.processor";
import { SYSTEM_JOBS, SYSTEM_QUEUE, type SystemPingResult } from "../src/queues/system.queue";
import { WorkerModule } from "../src/worker.module";

// Environment comes from vitest.config.mts.
const env = {
  REDIS_URL: process.env.REDIS_URL ?? "",
  QUEUE_PREFIX: process.env.QUEUE_PREFIX ?? "",
};

async function assertRedisReachable(): Promise<void> {
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 0 });
  try {
    await redis.connect();
    await redis.ping();
  } catch {
    throw new Error(`Redis is not reachable at ${env.REDIS_URL}. Start it with: pnpm infra:up`);
  } finally {
    redis.disconnect();
  }
}

describe("worker (e2e, real Redis)", () => {
  let moduleRef: TestingModule;
  let queue: Queue;
  let events: QueueEvents;

  beforeAll(async () => {
    await assertRedisReachable();
    moduleRef = await Test.createTestingModule({ imports: [WorkerModule] }).compile();
    moduleRef.useLogger(false); // the "unknown job" test fails a job on purpose
    await moduleRef.init();
    queue = moduleRef.get<Queue>(getQueueToken(SYSTEM_QUEUE));
    await queue.obliterate({ force: true });
    events = new QueueEvents(SYSTEM_QUEUE, buildQueueOptions(env));
    await events.waitUntilReady();
  });

  afterAll(async () => {
    await events?.close();
    await moduleRef?.close();
    // The module's queue is closed by now; clean up the test jobs with a separate connection.
    const cleanup = new Queue(SYSTEM_QUEUE, buildQueueOptions(env));
    await cleanup.obliterate({ force: true });
    await cleanup.close();
  });

  it("processes a ping job and returns its result", async () => {
    const sentAt = new Date().toISOString();
    const job = await queue.add(SYSTEM_JOBS.ping, { sentAt });
    const result = (await job.waitUntilFinished(events, 5_000)) as SystemPingResult;

    expect(result).toMatchObject({ pong: true, sentAt });
    expect(Date.parse(result.processedAt)).not.toBeNaN();
    expect(result.waitedMs).toBeGreaterThanOrEqual(0);
  });

  it("uses the shared prefix and job defaults", async () => {
    const job = await queue.add(SYSTEM_JOBS.ping, { sentAt: new Date().toISOString() });
    expect(queue.opts.prefix).toBe("erpplug-test");
    expect(job.opts.attempts).toBe(3);
    await job.waitUntilFinished(events, 5_000);
  });

  it("fails an unknown job at once instead of retrying it", async () => {
    const job = await queue.add("system.nope", {});
    await expect(job.waitUntilFinished(events, 5_000)).rejects.toThrow(/Unknown job "system.nope"/);
    const failed = await queue.getJob(job.id!);
    expect(failed?.attemptsMade).toBe(1);
  });

  it("applies WORKER_CONCURRENCY from the environment", () => {
    expect(moduleRef.get(SystemProcessor).worker.concurrency).toBe(2);
  });

  it("stops the worker cleanly on shutdown", async () => {
    const processor = moduleRef.get(SystemProcessor);
    await moduleRef.close();
    expect(processor.worker.isRunning()).toBe(false);
  });
});
