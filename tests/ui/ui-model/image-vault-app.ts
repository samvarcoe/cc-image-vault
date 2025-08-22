import { Page, expect } from 'playwright/test';
import { App } from './app';
import { HomePageDriver } from './pages/home-page-driver';

export class ImageVaultApp extends App {
  constructor(page: Page) {
    super(page);
  }

  // Page factory method
  get homePage(): HomePageDriver {
    return this.pageObject(HomePageDriver);
  }

  // App-level assertions for the Image Vault application
  async shouldHaveUrl(expectedUrl: string): Promise<void> {
    const currentUrl = this.getCurrentUrl();
    expect(currentUrl, { 
      message: `App URL is "${currentUrl}" instead of "${expectedUrl}" after navigation` 
    }).toBe(expectedUrl);
    console.log(`✓ App is on URL "${expectedUrl}"`);
  }

  async shouldHaveNoApiErrors(): Promise<void> {
    const apiRequests = await this.getRequestsForUrl('/api/');
    const failedApiRequests = apiRequests.filter(req => req.status && req.status >= 400);
    expect(failedApiRequests.length, { 
      message: `Found ${failedApiRequests.length} failed API requests instead of 0 during operation` 
    }).toBe(0);
    console.log('✓ No API request failures during operation');
  }
}