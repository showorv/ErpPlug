import { describe, expect, it } from "vitest";
import { validateEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://localhost:5432/erpplug_test",
  REDIS_URL: "redis://localhost:6379",
};

describe("validateEnv", () => {
  it("accepts a minimal valid environment and fills defaults", () => {
    const env = validateEnv(valid);
    expect(env.NODE_ENV).toBe("development");
    expect(env.API_PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it("turns the port into a number and the CORS list into an array", () => {
    const env = validateEnv({
      ...valid,
      API_PORT: "4100",
      CORS_ORIGINS: "http://localhost:5173, http://localhost:5174,",
    });
    expect(env.API_PORT).toBe(4100);
    expect(env.CORS_ORIGINS).toEqual(["http://localhost:5173", "http://localhost:5174"]);
  });

  it("names every missing or invalid variable in one error", () => {
    expect(() => validateEnv({ REDIS_URL: "http://wrong-scheme", API_PORT: "not-a-port" })).toThrow(
      /DATABASE_URL[\s\S]*REDIS_URL|API_PORT/,
    );
    try {
      validateEnv({ REDIS_URL: "http://wrong-scheme", API_PORT: "not-a-port" });
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).toContain("REDIS_URL");
      expect(message).toContain("API_PORT");
      expect(message).toContain(".env.example");
    }
  });
});
