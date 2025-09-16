import { defineConfig } from '@playwright/test';
import { CONFIG } from '@/config';

export default defineConfig({
  testDir: './specs',
  workers: 1,
  reporter: [
    ['list']
  ],
  use: {
    baseURL: CONFIG.UI_BASE_URL,
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    connectOptions: {
      wsEndpoint: 'ws://playwright-server:8080',  // Connect to the remote playwright server
    },
    actionTimeout: 1000
  },
  projects: [
    {
      name: 'client',
      testMatch: '**/*.spec.ts',
    },
  ],
  outputDir: '../../../output/client-test-artifacts',
  expect: {
    // Maximum time expect() should wait for the condition to be met.
    timeout: 1000,
  }
});