import { Page } from 'playwright/test';
import { App } from './base/app';
import { HomePage } from './pages/home';

export class ImageVaultApp extends App {
  constructor(page: Page) {
    super(page);
  }

  get homePage(): HomePage {
    return this.pageObject(HomePage);
  }
}