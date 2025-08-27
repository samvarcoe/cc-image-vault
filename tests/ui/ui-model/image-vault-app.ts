import { Page } from 'playwright/test';
import { App } from './app';
import { HomePageDriver } from './pages/home-page-driver';
import { CollectionPageDriver } from './pages/collection-page-driver';

export class ImageVaultApp extends App {
  constructor(page: Page) {
    super(page);
  }

  get homePage(): HomePageDriver {
    return this.pageObject(HomePageDriver);
  }

  get collectionPage(): CollectionPageDriver {
    return this.pageObject(CollectionPageDriver);
  }
}