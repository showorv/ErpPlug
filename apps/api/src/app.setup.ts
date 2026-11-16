import { type INestApplication, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { AllExceptionsFilter } from "./common/errors/all-exceptions.filter";
import type { Env } from "./config/env";

/**
 * Everything that shapes the HTTP surface. Shared by main.ts and the e2e tests so tests run
 * against exactly the app that ships.
 *
 *   /api/v1/{module}/...   versioned business routes (BRD 13)
 *   /api/health            liveness, unversioned
 *   /api/docs              Swagger UI;  /api/docs-json  OpenAPI document
 */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: config.get("CORS_ORIGINS", { infer: true }),
    credentials: true,
    exposedHeaders: ["x-request-id"],
  });

  const openApi = new DocumentBuilder()
    .setTitle("ErpPlug API")
    .setDescription("Modular, multi-tenant ERP platform API")
    .setVersion("1")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, () => SwaggerModule.createDocument(app, openApi), {
    jsonDocumentUrl: "api/docs-json",
  });
}
