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
    connectOptions: {
      wsEndpoint: 'ws://playwright-server:8080',  // Connect to the remote playwright server
    },
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
        // 'client/tests/acceptance/specs/collection-page/slideshow.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/image-status-updates.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/curate-mode.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/deleting-images.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/fullscreen-popover.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/fullscreen-status-updates.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/header-menu.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/selecting-images.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/uploading-images.spec.ts',
        // 'client/tests/acceptance/specs/collection-page/viewing-images.spec.ts'
        '**/*.spec.ts',
      ],
      dependencies: ['coupled'],
      fullyParallel: false,
      workers: 10,
    }
  ],
  outputDir: '../../../output/client-test-artifacts',
  expect: {
    timeout: 1000,
  }
});