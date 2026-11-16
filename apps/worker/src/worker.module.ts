import { resolve } from "node:path";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { type Env, validateEnv } from "./config/env";
import { buildQueueOptions } from "./queues/queue-options";
import { SystemProcessor } from "./queues/system.processor";
import { SYSTEM_QUEUE } from "./queues/system.queue";

/**
 * The worker process: the same NestJS module system as the API, without HTTP. As modules are
 * added (Phase 1+), their queue processors and event listeners are registered here too.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      expandVariables: true,
      // Works whether started from apps/worker (turbo, pnpm dev) or from the repo root.
      envFilePath: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get("LOG_LEVEL", { infer: true }),
          transport:
            config.get("NODE_ENV", { infer: true }) === "development"
              ? {
                  target: "pino-pretty",
                  options: { singleLine: true, translateTime: "SYS:HH:MM:ss" },
                }
              : undefined,
          base: { pid: process.pid, service: "worker" },
        },
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        buildQueueOptions({
          REDIS_URL: config.get("REDIS_URL", { infer: true }),
          QUEUE_PREFIX: config.get("QUEUE_PREFIX", { infer: true }),
        }),
    }),
    BullModule.registerQueue({ name: SYSTEM_QUEUE }),
  ],
  providers: [SystemProcessor],
})
export class WorkerModule {}
