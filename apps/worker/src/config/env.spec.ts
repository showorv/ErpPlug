import { describe, expect, it } from "vitest";
import { validateEnv } from "./env";

describe("worker validateEnv", () => {
  it("applies defaults", () => {
    expect(validateEnv({ REDIS_URL: "redis://localhost:6379" })).toEqual({
      NODE_ENV: "development",
      LOG_LEVEL: "info",
      REDIS_URL: "redis://localhost:6379",
      WORKER_CONCURRENCY: 5,
      QUEUE_PREFIX: "erpplug",
    });
  });

  it("lists every bad variable", () => {
    expect(() =>
      validateEnv({
        REDIS_URL: "http://localhost",
        WORKER_CONCURRENCY: "0",
        QUEUE_PREFIX: "Bad Prefix",
      }),
    ).toThrow(/REDIS_URL[\s\S]*WORKER_CONCURRENCY[\s\S]*QUEUE_PREFIX/);
  });
});
