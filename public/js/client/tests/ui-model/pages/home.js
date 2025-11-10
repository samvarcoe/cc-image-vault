import { PageObject } from '../base/page';
import { Element } from '../base/element';
export class HomePage extends PageObject {
    constructor() {
        super(...arguments);
        this.url = '/';
    }
    async visit(timeout = 2000) {
        LOGGER.log(`Navigating to ${this.constructor.name}: ${this.url}`);
        await this.page.goto(this.url);
        await this.page.waitForLoadState('load', { timeout });
        ;
        await this.shouldBeOnPage();
    }
    get header() {
        return this.element('Header Menu', '[data-id="header-menu"]');
    }
    get userMessage() {
        return this.element('User Message', '[data-id="user-message"]');
    }
    get collectionsList() {
        return this.component(CollectionsList, 'Collections List', '[data-id="collections-list"]');
    }
}
class CollectionsList extends Element {
    collection(name) {
        return name
            ? this.child(CollectionCard, `Collection Card: "${name}"`, `[data-id="collection-card-${name}"]`)
            : this.child(CollectionCard, 'Collection Card', '[data-id^="collection-card-"]');
    }
    get creationForm() {
        return this.child(CreationForm, 'Creation Form', '[data-id="creation-form"]');
    }
}
class CollectionCard extends Element {
    get title() {
        return this.child(Element, 'Name', '[data-id="collection-title"]');
    }
    get link() {
        return this.child(Element, 'Link', '[data-id="collection-link"]');
    }
}
class CreationForm extends Element {
    get nameInput() {
        return this.child(Element, 'Name Input', '[data-id="collection-name-input"]');
    }
    get submitButton() {
        return this.child(Element, 'Submit Button', '[data-id="submit-button"]');
    }
    get loadingSpinner() {
        return this.child(Element, 'Loading Spinner', '[data-id="loading-spinner"]');
    }
}
