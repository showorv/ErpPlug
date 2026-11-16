import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Job, UnrecoverableError } from "bullmq";
import type { Env } from "../config/env";
import {
  SYSTEM_JOBS,
  SYSTEM_QUEUE,
  type SystemPingData,
  type SystemPingResult,
} from "./system.queue";

/** Consumes the "system" queue. One processor per queue; it switches on the job name. */
@Processor(SYSTEM_QUEUE)
export class SystemProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemProcessor.name);

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  onApplicationBootstrap(): void {
    this.worker.concurrency = this.config.get("WORKER_CONCURRENCY", { infer: true });
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case SYSTEM_JOBS.ping:
        return this.ping(job as Job<SystemPingData>);
      default:
        // Retrying cannot fix an unknown job name, so fail it immediately.
        throw new UnrecoverableError(`Unknown job "${job.name}" on queue "${SYSTEM_QUEUE}".`);
    }
  }

  private ping(job: Job<SystemPingData>): SystemPingResult {
    const processedAt = new Date();
    return {
      pong: true,
      sentAt: job.data.sentAt,
      processedAt: processedAt.toISOString(),
      waitedMs: Math.max(0, processedAt.getTime() - job.timestamp),
    };
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      { err: error, jobId: job?.id, jobName: job?.name, attemptsMade: job?.attemptsMade },
      "Job failed",
    );
  }
}
