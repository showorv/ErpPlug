import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import type { Env } from "./config/env";

async function bootstrap(): Promise<void> {
  // bufferLogs: hold start-up logs until the pino logger is attached, so every line is structured.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);
  app.enableShutdownHooks();

  const port = app.get<ConfigService<Env, true>>(ConfigService).get("API_PORT", { infer: true });
  await app.listen(port);
}

void bootstrap();
