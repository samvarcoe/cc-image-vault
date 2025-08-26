import { Page, expect } from 'playwright/test';
import { App } from './app';
import { HomePageDriver } from './pages/home-page-driver';

export class ImageVaultApp extends App {
  constructor(page: Page) {
    super(page);
  }

  get homePage(): HomePageDriver {
    return this.pageObject(HomePageDriver);
  }
}