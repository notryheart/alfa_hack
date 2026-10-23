import { defineConfig } from "@playwright/test";

const externalUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: externalUrl ?? "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  },
  webServer: externalUrl
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
      },
  reporter: "list",
});
