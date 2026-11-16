import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// SWC compiles the TypeScript so Nest's decorator metadata (constructor injection) works in tests.
export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
    environment: "node",
    // Set before any test file is imported: WorkerModule validates the environment at import time.
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      // The e2e test needs a real Redis (pnpm infra:up locally, a service container in CI).
      // Database 15 and a separate prefix keep test jobs away from development data.
      REDIS_URL: process.env.TEST_REDIS_URL ?? "redis://localhost:6379/15",
      QUEUE_PREFIX: "erpplug-test",
      WORKER_CONCURRENCY: "2",
    },
  },
});
