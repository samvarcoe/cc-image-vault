import { Page } from 'playwright/test';
import { App } from './app';
import { HomePage } from './pages/home-page';
import { CollectionPage } from './pages/collection-page';

export class ImageVaultApp extends App {
  constructor(page: Page) {
    super(page);
  }

  get homePage(): HomePage {
    return this.pageObject(HomePage);
  }

  get collectionPage(): CollectionPage {
    return this.pageObject(CollectionPage);
  }
}