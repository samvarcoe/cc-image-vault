import CollectionPageModel from './model.js';
import CollectionPageView from './view.js';

export default class CollectionPageController {
    private lastFocusedElement: HTMLElement | null = null;

    constructor(
        private model: CollectionPageModel,
        private view: CollectionPageView
    ) {
        this.init();
    }

    private init(): void {
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        // Handle image card clicks to open popover
        document.addEventListener('click', (event) => {
            const imageCard = (event.target as Element).closest('[data-image-id]') as HTMLElement;
            if (imageCard) {
                const imageId = imageCard.dataset.imageId;
                if (imageId) {
                    this.openPopover(imageId, imageCard);
                }
            }
        });

        // Handle popover clicks to close popover (but not on the image)
        document.addEventListener('click', (event) => {
            const popover = (event.target as Element).closest('[data-id="fullscreen-popover"]');
            // Close if clicking on popover but not on the image itself
            if (popover) {
                this.closePopover();
            }
        });

        // Handle escape key to close popover
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.model.isPopoverVisible()) {
                this.closePopover();
            }
        });

        // Handle image load errors in popover
        document.addEventListener('error', (event) => {
            const popoverImage = event.target as HTMLImageElement;
            if (popoverImage && popoverImage.closest('[data-id="popover-image"]')) {
                this.handleImageLoadError();
            }
        }, true);
    }

    private openPopover(imageId: string, clickedElement: HTMLElement): void {
        this.lastFocusedElement = clickedElement;
        this.model.openPopover(imageId);
        this.view.update();
    }

    private closePopover(): void {
        this.model.closePopover();
        this.view.update();

        // Restore focus to the clicked thumbnail
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
    }

    private handleImageLoadError(): void {
        this.model.setPopoverError('Unable to load full image');
        this.view.update();
    }
}