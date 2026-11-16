import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { type ApiErrorBody, DEFAULT_ERROR_CODES } from "./api-error";

/** Turns every thrown error into the standard ApiErrorBody. Registered globally in app.setup.ts. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const { code, message, details } = this.describe(exception, status);

    if (status >= 500) {
      // Full detail goes to the log only; the client gets a generic message.
      this.logger.error({ err: exception, requestId: req.id }, "Unhandled error");
    }

    const body: ApiErrorBody = {
      error: {
        status,
        code,
        message,
        ...(details === undefined ? {} : { details }),
        requestId: String(req.id ?? ""),
        path: req.originalUrl ?? req.url,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(status).json(body);
  }

  private describe(
    exception: unknown,
    status: number,
  ): { code: string; message: string; details?: unknown } {
    const fallbackCode = DEFAULT_ERROR_CODES[status] ?? `HTTP_${status}`;

    if (!(exception instanceof HttpException) || status >= 500) {
      return { code: fallbackCode, message: "Something went wrong. Please try again." };
    }

    const response = exception.getResponse();
    if (typeof response === "string") {
      return { code: fallbackCode, message: response };
    }

    const r = response as { code?: unknown; message?: unknown; details?: unknown };
    const code = typeof r.code === "string" ? r.code : fallbackCode;
    // Nest's built-in validation errors put a list of messages in `message`.
    if (Array.isArray(r.message)) {
      return { code, message: "The request is not valid.", details: r.details ?? r.message };
    }
    const message = typeof r.message === "string" ? r.message : exception.message;
    return { code, message, details: r.details };
  }
}
