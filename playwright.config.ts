import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['allure-playwright'],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    baseURL: process.env.BASE_URL ?? 'https://parabank.parasoft.com',
  },
  projects: [
    {
      name: 'chromium-ui',
      testMatch: ['**/ui/**', '**/e2e/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-ui',
      testMatch: ['**/ui/**'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'api',
      testMatch: '**/api/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'performance',
      testMatch: '**/performance-lite/**',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
