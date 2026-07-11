import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for DOCT SPARK Platform.
 * Run these tests locally using: npx playwright test
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop 1440x900',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Desktop 1366x768',
      use: { viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'Tablet 768x1024',
      use: { ...devices['iPad Mini'] },
    },
    {
      name: 'Mobile 390x844',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile 360x800',
      use: { viewport: { width: 360, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
