import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    // ['html', { outputFolder: '../../output/ui-test-results', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'https://claude-code:3000',
    // trace: 'on-first-retry',
    // screenshot: 'only-on-failure',
    headless: true,
    ignoreHTTPSErrors: true, // Ignore self-signed certificate errors
    connectOptions: {
      wsEndpoint: 'ws://playwright-server:8080',  // Connect to the remote playwright server
    },
  },
  // projects: [
  //   {
  //     name: 'chromium',
  //     use: { ...devices['Desktop Chrome'] },
  //   },
  // ],
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30 * 1000,
  // },
});