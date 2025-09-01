import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  workers: 1,
  reporter: [
    ['list'],
  ],
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: '../../../output/api-test-artifacts',
});