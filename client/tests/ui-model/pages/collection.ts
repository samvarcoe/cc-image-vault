import { expect } from '@playwright/test';
import { PageObject } from '../base/page';
import { Element } from '../base/element';

export class CollectionPage extends PageObject {
    protected url = '/collection';

    get errorMessage(): Element {
        return this.element('Error Message', '[data-id="error-message"]');
    }

    get emptyMessage(): Element {
        return this.element('Empty Message', '[data-id="empty-message"]');
    }

    get imageGrid(): ImageGrid {
        return this.component(ImageGrid, 'Image Grid', '[data-id="image-grid"]');
    }

    async visitCollection(collectionName: string): Promise<void> {
        const collectionUrl = `/collection/${collectionName}`;
        await this.page.goto(collectionUrl);
        await this.page.waitForLoadState('networkidle');
    }
}

class ImageGrid extends Element {

    image(imageId?: string): ImageCard {
        return imageId
        ? this.child(ImageCard, 'Image', '[data-id^="image-card-"]')
        : this.child(ImageCard, `Image: "${imageId}"`, `[data-id="image-card-${imageId}"]`);
    };

    async shouldHaveColumnCount(count: number): Promise<void> {
        const gridTemplateColumns = await this.locator.evaluate(el =>
            window.getComputedStyle(el).gridTemplateColumns
        );

        const columnCount = gridTemplateColumns.split(' ').filter((val: string) => val !== '').length;
        expect(columnCount, `Image grid has ${columnCount} columns instead of ${count} on desktop viewport`).toBe(count);

        console.log(`✓ Image grid displays in ${count}-column layout`);
    }
}

class ImageCard extends Element {
    get image(): Element {
        return this.child(Element, 'Image', 'img');
    }
}