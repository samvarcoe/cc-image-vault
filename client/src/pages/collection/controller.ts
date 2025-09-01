import { Controller } from '../../mvc.js';
import CollectionPageModel from './model.js';
import CollectionPageView from './view.js';

export default class CollectionPageController extends Controller<CollectionPageModel, CollectionPageView> {
  constructor(model: CollectionPageModel, view: CollectionPageView) {
    super(model, view);
    this.bindEventHandlers();
  }

  private bindEventHandlers(): void {
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;

    if (action === 'open-popover') {
      const imageId = target.dataset.imageId;
      if (imageId) {
        this.handleThumbnailClick(imageId);
      }
    } else if (action === 'close-popover') {
      this.handlePopoverClose();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.model.isPopoverOpen()) {
      this.handleEscKeyPress(event);
    }
  }

  handleThumbnailClick(imageId: string): void {
    this.model.openPopover(imageId);
    this.view.update();
  }

  handlePopoverClose(): void {
    this.model.closePopover();
    this.view.update();
  }

  handleEscKeyPress(event: KeyboardEvent): void {
    event.preventDefault();
    this.handlePopoverClose();
  }

  handleBackdropClick(): void {
    // This is covered by the general click handler with data-action="close-popover"
    this.handlePopoverClose();
  }
}