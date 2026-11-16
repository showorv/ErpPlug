import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOkResponse, ApiProperty, ApiTags } from "@nestjs/swagger";

class HealthResponse {
  @ApiProperty({ example: "ok" })
  status: "ok";

  @ApiProperty({ example: "api" })
  service: string;

  @ApiProperty({ example: 42, description: "Seconds since the process started" })
  uptimeSeconds: number;

  @ApiProperty({ example: "2026-11-17T10:00:00.000Z" })
  timestamp: string;
}

/**
 * Liveness check: answers as long as the process is up. Served at /api/health (no version).
 * Readiness checks for Postgres and Redis are added once their clients exist (Prisma: Uday, Phase 0).
 */
@ApiTags("health")
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponse })
  check(): HealthResponse {
    return {
      status: "ok",
      service: "api",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
