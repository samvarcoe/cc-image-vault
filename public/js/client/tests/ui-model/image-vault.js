import { UI } from './base/ui';
import { HomePage } from './pages/home';
import { CollectionPage } from './pages/collection';
export class ImageVault extends UI {
    constructor(page) {
        super(page);
    }
    get homePage() {
        return this.pageObject(HomePage);
    }
    get collectionPage() {
        return this.pageObject(CollectionPage);
    }
}
