import { defineConfig } from '@playwright/test';
import { CONFIG } from '../config';

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  workers: 10,
  reporter: [
    ['list']
  ],
  use: {
    baseURL: CONFIG.UI_BASE_URL,
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