import { defineConfig } from '@playwright/test';
import '@/config';

export default defineConfig({
  testDir: './specs',
  reporter: [
    ['dot']
  ],
  use: {
    baseURL: CONFIG.UI_BASE_URL,
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 2000
  },
  projects: [
    {
      name: 'coupled',
      testMatch: '**/home-page/*.spec.ts',
      fullyParallel: false,
      workers: 1,
    },
    {
      name: 'isolated',
      testIgnore: '**/home-page/*.spec.ts',
      testMatch: [
        '**/*.spec.ts',
      ],
      dependencies: ['coupled'],
      fullyParallel: false,
      workers: 8,
    }
  ],
  outputDir: '../../../output/client-test-artifacts',
  expect: {
    timeout: 1000,
  }
});