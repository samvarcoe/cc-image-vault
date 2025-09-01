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
      name: 'domain',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: '../../../output/domain-test-artifacts',
});