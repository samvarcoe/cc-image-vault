import { PageObject } from '../base/page';
import { Element } from '../base/element';

export class HomePage extends PageObject {
    protected url = '/';

    get userMessage(): Element {
        return this.element('User Message', '[data-id="user-message"]');
    }

    get collectionsList(): CollectionsList {
        return this.component(CollectionsList, 'Collections List', '[data-id="collections-list"]');
    }
    
}

class CollectionsList extends Element {
    collection(name?: string): CollectionCard {
        return name
            ? this.child(CollectionCard, `Collection Card: "${name}"`, `[data-id="collection-card-${name}"]`)
            : this.child(CollectionCard, 'Collection Card', '[data-id^="collection-card-"]');
    }

    get creationForm(): CreationForm {
        return this.child(CreationForm, 'Creation Form', '[data-id="creation-form"]');
    }
}

class CollectionCard extends Element {
    get title(): Element {
        return this.child(Element, 'Name', '[data-id="collection-title"]');
    }

    get link(): Element {
        return this.child(Element, 'Link', '[data-id="collection-link"]')
    }
}

class CreationForm extends Element {
    get nameInput(): Element {
        return this.child(Element, 'Name Input', '[data-id="collection-name-input"]');
    }

    get submitButton(): Element {
        return this.child(Element, 'Submit Button', '[data-id="submit-button"]');
    }

    get loadingSpinner(): Element {
        return this.child(Element, 'Loading Spinner', '[data-id="loading-spinner"]');
    }
}