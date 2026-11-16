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
    // Set before any test file is imported: AppModule validates the environment at import time.
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      // Never connected to in these tests; only has to be a valid URL.
      DATABASE_URL: "postgresql://localhost:5432/erpplug_test",
      REDIS_URL: "redis://localhost:6379",
    },
  },
});
