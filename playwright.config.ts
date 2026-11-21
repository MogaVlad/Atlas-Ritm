import { defineConfig } from "@playwright/test";

/**
 * Journey tests (roadmap step 9). Run: npm run test:e2e
 * Uses the Chrome already installed on the machine (no browser download).
 * Reuses a dev server already running on :3000, otherwise starts one.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    locale: "ro-RO",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
