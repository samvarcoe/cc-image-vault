export default class CollectionPageController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.lastFocusedElement = null;
        this.init();
    }
    init() {
        this.attachEventListeners();
    }
    attachEventListeners() {
        document.addEventListener('click', (event) => {
            const curateButton = event.target.closest('[data-id="curate-button"]');
            if (curateButton) {
                this.toggleCurateMode();
            }
        });
        document.addEventListener('click', (event) => {
            const selectAllButton = event.target.closest('[data-id="select-all-button"]');
            if (selectAllButton) {
                this.selectAllImages();
            }
        });
        document.addEventListener('click', (event) => {
            const clearButton = event.target.closest('[data-id="clear-button"]');
            if (clearButton) {
                this.clearSelection();
            }
        });
        document.addEventListener('click', (event) => {
            const imageCard = event.target.closest('[data-image-id]');
            if (imageCard) {
                const imageId = imageCard.dataset.imageId;
                if (imageId) {
                    if (this.model.isCurateMode()) {
                        this.toggleImageSelection(imageId);
                    }
                    else {
                        this.openPopover(imageId, imageCard);
                    }
                }
            }
        });
        document.addEventListener('click', (event) => {
            const popover = event.target.closest('[data-id="fullscreen-popover"]');
            if (popover) {
                this.closePopover();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.model.isPopoverVisible()) {
                this.closePopover();
            }
        });
        document.addEventListener('error', (event) => {
            const popoverImage = event.target;
            if (popoverImage && popoverImage.closest('[data-id="popover-image"]')) {
                this.handleImageLoadError();
            }
        }, true);
    }
    openPopover(imageId, clickedElement) {
        this.lastFocusedElement = clickedElement;
        this.model.openPopover(imageId);
        this.view.update();
    }
    closePopover() {
        this.model.closePopover();
        this.view.update();
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
    }
    handleImageLoadError() {
        this.model.setPopoverError('Unable to load full image');
        this.view.update();
    }
    toggleCurateMode() {
        this.model.toggleCurateMode();
        this.updateUrlParams();
        this.view.update();
    }
    toggleImageSelection(imageId) {
        this.model.toggleImageSelection(imageId);
        this.view.update();
    }
    selectAllImages() {
        this.model.selectAllImages();
        this.view.update();
    }
    clearSelection() {
        this.model.clearSelection();
        this.view.update();
    }
    updateUrlParams() {
        const url = new URL(window.location.href);
        const curateValue = this.model.isCurateMode() ? 'true' : 'false';
        url.searchParams.set('curate', curateValue);
        window.history.pushState({}, '', url.toString());
    }
}
