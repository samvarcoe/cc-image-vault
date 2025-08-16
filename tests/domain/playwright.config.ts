import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30000,
  reporter: [
    ['list'],
  ],
  use: {
    // Domain tests don't need browser context
    headless: true,
  },
  projects: [
    {
      name: 'domain',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: '../../output/domain-test-artifacts',
});