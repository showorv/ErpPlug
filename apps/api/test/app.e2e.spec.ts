import "reflect-metadata";
import { Controller, Get, HttpStatus, type INestApplication, Query } from "@nestjs/common";
import { defineListQuery, type ListQueryOf, paginate } from "@erpplug/contracts";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { ApiException } from "../src/common/errors/api-error";
import { ListQueryPipe } from "../src/common/list-query/list-query.pipe";

/** Test-only routes that throw, to check every kind of error comes out in the standard shape. */
@Controller("test-errors")
class ThrowingController {
  @Get("api-exception")
  apiException(): never {
    throw new ApiException(HttpStatus.CONFLICT, "test.ALREADY_DONE", "Already done.", { id: 7 });
  }

  @Get("crash")
  crash(): never {
    throw new Error("internal detail INTERNAL-SENTINEL-42");
  }
}

const thingListQuery = defineListQuery({
  sortable: ["name", "createdAt"],
  filterable: {
    status: { type: "enum", values: ["active", "archived"] },
    total: { type: "number" },
  },
  defaultSort: "name",
  search: true,
});

/** Test-only list route, to check the list conventions end to end. */
@Controller("test-things")
class ThingsController {
  @Get()
  list(@Query(new ListQueryPipe(thingListQuery)) query: ListQueryOf<typeof thingListQuery>) {
    return paginate([{ query }], 61, query);
  }
}

describe("API skeleton (e2e)", () => {
  let app: INestApplication;

  // Test environment variables are set in vitest.config.mts.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ThrowingController, ThingsController],
    }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /api/health answers ok and returns a request id", async () => {
    const res = await request(app.getHttpServer()).get("/api/health").expect(200);
    expect(res.body).toMatchObject({ status: "ok", service: "api" });
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(res.headers["x-request-id"]).toMatch(/^[\w-]{8,64}$/);
  });

  it("echoes a caller's x-request-id", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/health")
      .set("x-request-id", "trace-abc-12345")
      .expect(200);
    expect(res.headers["x-request-id"]).toBe("trace-abc-12345");
  });

  it("returns unknown routes as a standard NOT_FOUND error", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/nope").expect(404);
    expect(res.body.error).toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      path: "/api/v1/nope",
      requestId: res.headers["x-request-id"],
    });
    expect(typeof res.body.error.message).toBe("string");
    expect(Date.parse(res.body.error.timestamp)).not.toBeNaN();
  });

  it("passes an ApiException's code, message and details through", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/test-errors/api-exception")
      .expect(409);
    expect(res.body.error).toMatchObject({
      status: 409,
      code: "test.ALREADY_DONE",
      message: "Already done.",
      details: { id: 7 },
    });
  });

  it("hides internal details of unexpected errors", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/test-errors/crash").expect(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.body)).not.toContain("INTERNAL-SENTINEL-42");
  });

  it("parses list query parameters and returns the paginated shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/test-things")
      .query(
        "page=2&pageSize=10&sort=-createdAt&filter.status.in=active,archived&filter.total.gte=5&q=rahim",
      )
      .expect(200);
    expect(res.body.meta).toEqual({ page: 2, pageSize: 10, totalItems: 61, totalPages: 7 });
    expect(res.body.items[0].query).toEqual({
      page: 2,
      pageSize: 10,
      sort: [{ field: "createdAt", direction: "desc" }],
      filters: [
        { field: "status", op: "in", value: ["active", "archived"] },
        { field: "total", op: "gte", value: 5 },
      ],
      q: "rahim",
    });
  });

  it("rejects bad list parameters with INVALID_QUERY and per-parameter details", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/test-things")
      .query("pageSize=1000&sort=costPrice&filter.status=deleted&filter[total]=1")
      .expect(400);
    expect(res.body.error.code).toBe("INVALID_QUERY");
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual([
      "pageSize",
      "sort",
      "filter.status",
      "filter[total]",
    ]);
  });

  it("serves the OpenAPI document and the Swagger UI", async () => {
    const json = await request(app.getHttpServer()).get("/api/docs-json").expect(200);
    expect(json.body.info.title).toBe("ErpPlug API");
    expect(Object.keys(json.body.paths)).toContain("/api/health");

    const ui = await request(app.getHttpServer()).get("/api/docs").expect(200);
    expect(ui.text).toContain("swagger");
  });
});
