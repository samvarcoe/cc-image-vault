/**
 * Shared test configuration for consistent URLs across test suites
 */

export const TEST_CONFIG = {
  // Base URLs for different environments
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  UI_BASE_URL: process.env.UI_BASE_URL || 'http://claude-code:3000',
} as const;