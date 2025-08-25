import { defineConfig } from '@playwright/test';
import { TEST_CONFIG } from './utils/test-config';

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  workers: 10,
  reporter: [
    ['list']
  ],
  use: {
    baseURL: TEST_CONFIG.UI_BASE_URL,
    headless: true,
    connectOptions: {
      wsEndpoint: 'ws://playwright-server:8080',  // Connect to the remote playwright server
    },
  },
  projects: [
    {
      name: 'all',
      testMatch: '**/*.spec.ts',
    },
  ],
});