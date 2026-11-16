import "reflect-metadata";
import { Logger as NestLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { WorkerModule } from "./worker.module";

async function bootstrap(): Promise<void> {
  // No HTTP server: an application context runs the queue processors only.
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // On SIGTERM/SIGINT, stop taking new jobs and let running ones finish before exiting.
  app.enableShutdownHooks();
  new NestLogger("Worker").log("Worker started; waiting for jobs.");
}

void bootstrap();
