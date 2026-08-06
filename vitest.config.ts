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
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_ci_dummy_key_for_build_only",
      CLERK_SECRET_KEY: "sk_test_ci_dummy_key_for_build_only",
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
      NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: "/dashboard",
      NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: "/dashboard",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
