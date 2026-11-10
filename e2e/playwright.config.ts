import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      testIgnore: "prototype.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: "prototype.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "tablet",
      testMatch: "prototype.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "pnpm start -H 0.0.0.0",
    cwd: "../frontend",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
  },
});
