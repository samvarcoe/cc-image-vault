import { Controller } from '../../mvc.js';
export default class CollectionPageController extends Controller {
    constructor(model, view) {
        super(model, view);
        this.bindEventHandlers();
    }
    bindEventHandlers() {
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    handleClick(event) {
        const target = event.target;
        const action = target.dataset.action;
        if (action === 'open-popover') {
            const imageId = target.dataset.imageId;
            if (imageId) {
                this.handleThumbnailClick(imageId);
            }
        }
        else if (action === 'close-popover') {
            this.handlePopoverClose();
        }
    }
    handleKeyDown(event) {
        if (event.key === 'Escape' && this.model.isPopoverOpen()) {
            this.handleEscKeyPress(event);
        }
    }
    handleThumbnailClick(imageId) {
        this.model.openPopover(imageId);
        this.view.update();
    }
    handlePopoverClose() {
        this.model.closePopover();
        this.view.update();
    }
    handleEscKeyPress(event) {
        event.preventDefault();
        this.handlePopoverClose();
    }
    handleBackdropClick() {
        this.handlePopoverClose();
    }
}
