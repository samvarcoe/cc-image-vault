import { Page } from 'playwright/test';
import { UI } from './base/ui';
import { HomePage } from './pages/home';
import { CollectionPage } from './pages/collection';

export class ImageVault extends UI {
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