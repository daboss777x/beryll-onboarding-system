import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const env = {
  NEXT_PUBLIC_DEMO_MODE: "true",
  DEMO_MODE: "true",
  DEMO_SESSION_SECRET: "e2e-test-secret-0123456789abcdef0123456789abcdef",
  NEXT_DIST_DIR: ".next-e2e",
  PORT: String(PORT),
  OPENAI_API_KEY: "",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
};

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/.results",
  timeout: 90_000,
  // keep failures fast: individual actions should never take more than 8s

  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { actionTimeout: 8_000, navigationTimeout: 20_000, baseURL: `http://localhost:${PORT}`, trace: "off", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 600_000,
    // The in-memory store keeps task progress across tests; a stale server leaks state. Opt in with PW_REUSE=1.
    reuseExistingServer: !!process.env.PW_REUSE,
    env,
  },
});
