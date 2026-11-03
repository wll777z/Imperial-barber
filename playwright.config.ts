import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch:
    process.env.E2E_MODE === "live"
      ? "live.spec.ts"
      : ["site.spec.ts", "booking.spec.ts"],
  use: {
    baseURL: "http://127.0.0.1:3000",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env:
      process.env.E2E_MODE === "live"
        ? {}
        : {
            NEXT_PUBLIC_SUPABASE_URL: "",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
            SUPABASE_SERVICE_ROLE_KEY: "",
          },
    timeout: 120000,
  },
  workers: 1,
});
