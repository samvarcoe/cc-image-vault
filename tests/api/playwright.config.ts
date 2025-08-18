import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30000,
  // Force sequential execution for API tests due to shared filesystem state
  workers: 1,
  reporter: [
    ['list'],
  ],
  use: {
    // API tests don't need browser context
    headless: true,
  },
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: '../../output/api-test-artifacts',
});