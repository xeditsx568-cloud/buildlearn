import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/buildlearn_test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
