import { PageObject } from '../base/page';
import { Element } from '../base/element';

export class HomePage extends PageObject {
    protected url = '/';

    get userMessage(): Element {
        return this.element('User Message', '[data-id="user-message"]');
    }

    collectionCard(name?: string): CollectionCard {
        return name
            ? this.component(CollectionCard, `Collection Card: "${name}"`, `[data-id="collection-card-${name}"]`)
            : this.component(CollectionCard, 'Collection Card', '[data-id^="collection-card-"]');
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