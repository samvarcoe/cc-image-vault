import CollectionPageModel from './model.js';
import CollectionPageView from './view.js';

// Constants
const SLIDESHOW_INTERVAL_MS = 5000;
const STATUS_MESSAGE_DISPLAY_DURATION_MS = 500;
const BATCH_SIZE = 10;

export default class CollectionPageController {
    private lastFocusedElement: HTMLElement | null = null;
    private slideshowTimer: NodeJS.Timeout | null = null;
    private eventListeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

    // API Methods
    private async apiUpdateImageStatus(collectionName: string, imageId: string, status: ImageStatus): Promise<void> {
        const response = await fetch(`/api/images/${collectionName}/${imageId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error(`Failed to update image ${imageId}`);
        }
    }

    private async apiDeleteImage(collectionName: string, imageId: string): Promise<void> {
        const response = await fetch(`/api/images/${collectionName}/${imageId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete image ${imageId}`);
        }
    }

    private async apiUploadImage(collectionName: string, file: File): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/images/${collectionName}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file ${file.name}`);
        }
    }

    constructor(
        private model: CollectionPageModel,
        private view: CollectionPageView
    ) {
        this.init();
    }

    private init(): void {
        this.attachEventListeners();
        this.attachUnloadHandler();
    }

    public cleanup(): void {
        this.stopSlideshowTimer();
        this.removeAllEventListeners();
    }

    private removeAllEventListeners(): void {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
    }

    private addEventListener(element: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions): void {
        element.addEventListener(type, handler, options);
        this.eventListeners.push({ element, type, handler });
    }

    private getImageIdFromElement(element: Element | null): string | null {
        const imageCard = element?.closest('[data-image-id]') as HTMLElement;
        return imageCard?.dataset.imageId || null;
    }

    private getButtonElement(target: EventTarget | null, selector: string): Element | null {
        return (target as Element)?.closest?.(selector) || null;
    }

    private attachUnloadHandler(): void {
        this.addEventListener(window, 'beforeunload', (event) => {
            if (this.model.isUploading()) {
                const message = 'Upload currently in progress, pending image uploads will be canceled if you leave the page';
                event.preventDefault();
                (event as BeforeUnloadEvent).returnValue = message;
                return message;
            }
            return undefined;
        });

        // Cleanup on page unload
        this.addEventListener(window, 'unload', () => {
            this.cleanup();
        });
    }

    private attachEventListeners(): void {
        // Handle slideshow button clicks
        this.addEventListener(document, 'click', (event) => {
            const slideshowButton = this.getButtonElement(event.target, '[data-id="slideshow-button"]');
            if (slideshowButton && !slideshowButton.hasAttribute('disabled')) {
                this.handleSlideshowButtonClick();
            }
        });

        // Handle upload button clicks
        this.addEventListener(document, 'click', (event) => {
            const uploadButton = this.getButtonElement(event.target, '[data-id="upload-button"]');
            if (uploadButton && !uploadButton.hasAttribute('disabled')) {
                this.handleUploadButtonClick();
            }
        });

        // Handle curate button clicks
        this.addEventListener(document, 'click', (event) => {
            const curateButton = (event.target as Element).closest('[data-id="curate-button"]');
            if (curateButton) {
                this.toggleCurateMode();
            }
        });

        // Handle Select All button clicks
        this.addEventListener(document, 'click', (event) => {
            const selectAllButton = (event.target as Element).closest('[data-id="select-all-button"]');
            if (selectAllButton) {
                this.selectAllImages();
            }
        });

        // Handle Clear button clicks
        this.addEventListener(document, 'click', (event) => {
            const clearButton = (event.target as Element).closest('[data-id="clear-button"]');
            if (clearButton) {
                this.clearSelection();
            }
        });

        // Handle Keep button clicks
        this.addEventListener(document, 'click', (event) => {
            const keepButton = (event.target as Element).closest('[data-id="keep-button"]');
            if (keepButton && !keepButton.hasAttribute('disabled')) {
                this.handleKeepImages();
            }
        });

        // Handle Discard button clicks
        this.addEventListener(document, 'click', (event) => {
            const discardButton = (event.target as Element).closest('[data-id="discard-button"]');
            if (discardButton && !discardButton.hasAttribute('disabled')) {
                this.handleDiscardImages();
            }
        });

        // Handle Restore button clicks
        this.addEventListener(document, 'click', (event) => {
            const restoreButton = (event.target as Element).closest('[data-id="restore-button"]');
            if (restoreButton && !restoreButton.hasAttribute('disabled')) {
                this.handleRestoreImages();
            }
        });

        // Handle Delete button clicks
        this.addEventListener(document, 'click', (event) => {
            const deleteButton = (event.target as Element).closest('[data-id="delete-button"]');
            if (deleteButton && !deleteButton.hasAttribute('disabled')) {
                this.handleDeleteButtonClick();
            }
        });

        // Handle Download button clicks
        this.addEventListener(document, 'click', (event) => {
            const downloadButton = (event.target as Element).closest('[data-id="download-button"]');
            if (downloadButton && !downloadButton.hasAttribute('disabled')) {
                this.handleDownloadImages();
            }
        });

        // Handle confirmation dialog button clicks
        this.addEventListener(document, 'click', (event) => {
            const cancelButton = (event.target as Element).closest('[data-id="cancel-button"]');
            const confirmDeleteButton = (event.target as Element).closest('[data-id="confirm-delete-button"]');

            if (cancelButton) {
                // Check if it's in upload dialog or confirmation dialog
                const uploadDialog = cancelButton.closest('[data-id="upload-dialog"]');
                if (uploadDialog) {
                    this.handleUploadCancel();
                } else {
                    this.handleCancelDelete();
                }
            } else if (confirmDeleteButton) {
                this.handleConfirmDelete();
            }
        });

        // Handle upload dialog add button clicks
        this.addEventListener(document, 'click', (event) => {
            const addButton = (event.target as Element).closest('[data-id="add-button"]');
            if (addButton) {
                this.handleUploadAdd();
            }
        });

        // Handle image card clicks to open popover (only if not in curate mode) or toggle selection (if in curate mode)
        this.addEventListener(document, 'click', (event) => {
            const imageId = this.getImageIdFromElement(event.target as Element);
            if (imageId) {
                const imageCard = (event.target as Element).closest('[data-image-id]') as HTMLElement;
                if (this.model.isCurateMode()) {
                    this.toggleImageSelection(imageId);
                } else if (imageCard) {
                    this.openPopover(imageId, imageCard);
                }
            }
        });

        // Handle popover clicks to close popover (but not on the image)
        this.addEventListener(document, 'click', (event) => {
            const popover = (event.target as Element).closest('[data-id="fullscreen-popover"]');
            // Close if clicking on popover but not on the image itself
            if (popover) {
                this.closePopover();
            }
        });

        // Handle keyboard events
        this.addEventListener(document, 'keydown', (event) => {
            const keyboardEvent = event as KeyboardEvent;
            if (keyboardEvent.key === 'Escape') {
                if (this.model.isSlideshowVisible()) {
                    this.closeSlideshowAndCleanup();
                } else if (this.model.isPopoverVisible()) {
                    this.closePopover();
                }
            } else if (keyboardEvent.key === ' ' && this.model.isSlideshowVisible()) {
                keyboardEvent.preventDefault(); // Prevent page scroll
                this.model.toggleSlideshowPause();
                this.view.update();
            } else if (keyboardEvent.key === 'Enter') {
                if (this.model.isSlideshowVisible()) {
                    keyboardEvent.preventDefault();
                    this.model.advanceSlideshow();
                    this.view.update();
                } else if (this.model.isPopoverVisible()) {
                    keyboardEvent.preventDefault();
                    this.model.advancePopoverToNext();
                    this.view.update();
                }
            } else if (keyboardEvent.key === 'Tab' && this.model.isPopoverVisible()) {
                keyboardEvent.preventDefault();
                this.handlePopoverTabKeyPress();
            } else if (keyboardEvent.key === 'Backspace' && this.model.isPopoverVisible()) {
                keyboardEvent.preventDefault();
                this.handlePopoverBackspaceKeyPress();
            }
        });

        // Handle image load errors
        this.addEventListener(document, 'error', (event) => {
            const image = event.target as HTMLImageElement;
            if (image && image.closest('[data-id="popover-image"]')) {
                this.handleImageLoadError();
            } else if (image && image.closest('[data-id="slideshow-image"]')) {
                this.handleSlideshowImageLoadError();
            }
        }, { capture: true });

        // Handle mouse wheel events on popover
        this.addEventListener(document, 'wheel', (event) => {
            const wheelEvent = event as WheelEvent;
            // Only handle wheel events when popover is visible
            if (!this.model.isPopoverVisible()) {
                return;
            }

            // Check if the wheel event is on the popover element
            const popover = (wheelEvent.target as Element).closest('[data-id="fullscreen-popover"]');
            if (popover) {
                wheelEvent.preventDefault(); // Prevent page scrolling

                if (wheelEvent.deltaY > 0) {
                    // Wheel down - advance to next image
                    this.model.advancePopoverToNext();
                    this.view.update();
                } else if (wheelEvent.deltaY < 0) {
                    // Wheel up - go to previous image
                    this.model.advancePopoverToPrevious();
                    this.view.update();
                }
            }
        }, { passive: false }); // Not passive so we can preventDefault
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

    private handleSlideshowImageLoadError(): void {
        // Skip to the next image when current image fails to load
        this.model.skipToNextImage();
        this.view.update();
    }

    private toggleCurateMode(): void {
        this.model.toggleCurateMode();
        this.updateUrlParams();
        this.view.update();
    }

    private toggleImageSelection(imageId: string): void {
        this.model.toggleImageSelection(imageId);
        this.view.update();
    }

    private selectAllImages(): void {
        this.model.selectAllImages();
        this.view.update();
    }

    private clearSelection(): void {
        this.model.clearSelection();
        this.view.update();
    }

    private updateUrlParams(): void {
        const url = new URL(window.location.href);
        const curateValue = this.model.isCurateMode() ? 'true' : 'false';
        url.searchParams.set('curate', curateValue);

        // Update the URL without reloading the page
        window.history.pushState({}, '', url.toString());
    }

    private async handleKeepImages(): Promise<void> {
        await this.updateImageStatus('COLLECTION');
    }

    private async handleDiscardImages(): Promise<void> {
        await this.updateImageStatus('ARCHIVE');
    }

    private async handleRestoreImages(): Promise<void> {
        await this.updateImageStatus('COLLECTION');
    }

    private async updateImageStatus(newStatus: ImageStatus): Promise<void> {
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }

        // Clear any previous errors
        this.model.clearStatusUpdateError();

        // Optimistically hide the selected images
        this.model.hideSelectedImages();
        this.view.update();

        // Batch the requests (max concurrent)
        const collectionName = this.model.getCollectionName();
        const batchSize = BATCH_SIZE;
        const allResults: Array<{ imageId: string; success: boolean }> = [];

        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId =>
                this.apiUpdateImageStatus(collectionName, imageId, newStatus)
                    .then(() => ({ imageId, success: true }))
                    .catch(() => ({ imageId, success: false }))
            );

            // Wait for this batch to complete before moving to the next
            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults);
        }

        // Process results
        const successfulIds = allResults.filter(r => r.success).map(r => r.imageId);
        const failedIds = allResults.filter(r => !r.success).map(r => r.imageId);

        if (successfulIds.length > 0) {
            // Remove successful images from the DOM
            this.model.removeImages(successfulIds);
        }

        if (failedIds.length > 0) {
            // Unhide failed images
            this.model.unhideImages(failedIds);
            this.model.setStatusUpdateError('Unable to complete update for all Images');
        }

        this.view.update();
    }


    private handleDeleteButtonClick(): void {
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }

        // Show confirmation dialog
        this.model.showConfirmationDialog('Are you sure you want to permanently delete these images? This action cannot be undone.');
        this.view.update();
    }

    private handleCancelDelete(): void {
        // Hide confirmation dialog without making any changes
        this.model.hideConfirmationDialog();
        this.view.update();
    }

    private async handleConfirmDelete(): Promise<void> {
        // Hide confirmation dialog immediately
        this.model.hideConfirmationDialog();

        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }

        // Clear any previous errors
        this.model.clearStatusUpdateError();

        // Optimistically hide the selected images
        this.model.hideSelectedImages();
        this.view.update();

        // Batch the delete requests (max concurrent)
        const collectionName = this.model.getCollectionName();
        const batchSize = BATCH_SIZE;
        const allResults: Array<{ imageId: string; success: boolean }> = [];

        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId =>
                this.apiDeleteImage(collectionName, imageId)
                    .then(() => ({ imageId, success: true }))
                    .catch(() => ({ imageId, success: false }))
            );

            // Wait for this batch to complete before moving to the next
            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults);
        }

        // Process results
        const successfulIds = allResults.filter(r => r.success).map(r => r.imageId);
        const failedIds = allResults.filter(r => !r.success).map(r => r.imageId);

        if (successfulIds.length > 0) {
            // Remove successful images from the DOM
            this.model.removeImages(successfulIds);
        }

        if (failedIds.length > 0) {
            // Unhide failed images and show error
            this.model.unhideImages(failedIds);
            if (failedIds.length === allResults.length) {
                // All images failed
                this.model.setStatusUpdateError('Unable to delete images');
            } else {
                // Some images failed
                this.model.setStatusUpdateError('Unable to delete all images');
            }
        }

        this.view.update();
    }

    private async handleDownloadImages(): Promise<void> {
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }

        // Clear any previous errors and set downloading state
        this.model.clearStatusUpdateError();
        this.model.setDownloading(true);
        this.view.update();

        try {
            const collectionName = this.model.getCollectionName();
            const currentStatus = this.model.getCurrentStatus();

            if (selectedImageIds.length === 1) {
                // Single image download
                const imageId = selectedImageIds[0]!;
                await this.downloadSingleImage(collectionName, imageId);
            } else {
                // Multiple images download
                const archiveName = `${collectionName}-${currentStatus}-images`;
                await this.downloadMultipleImages(collectionName, selectedImageIds, archiveName);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.model.setStatusUpdateError('Unable to download image(s)');
        } finally {
            this.model.setDownloading(false);
            this.view.update();
        }
    }

    private async downloadSingleImage(collectionName: string, imageId: string): Promise<void> {
        const url = `/api/images/${collectionName}/${imageId}/download`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Download failed with status ${response.status}`);
        }

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = imageId; // Fallback to imageId if we can't extract filename
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(objectUrl);
    }

    private async downloadMultipleImages(collectionName: string, imageIds: string[], archiveName: string): Promise<void> {
        // Use form submission for native browser streaming
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/api/images/${collectionName}/download`;

        // Add imageIds as comma-separated string
        const imageIdsInput = document.createElement('input');
        imageIdsInput.type = 'hidden';
        imageIdsInput.name = 'imageIds';
        imageIdsInput.value = imageIds.join(',');
        form.appendChild(imageIdsInput);

        // Add archive name
        const archiveNameInput = document.createElement('input');
        archiveNameInput.type = 'hidden';
        archiveNameInput.name = 'archiveName';
        archiveNameInput.value = archiveName;
        form.appendChild(archiveNameInput);

        // Submit form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    private handleUploadButtonClick(): void {
        this.model.showUploadDialog();
        this.view.update();
    }

    private handleUploadCancel(): void {
        this.model.hideUploadDialog();
        this.view.update();
    }

    private async handleUploadAdd(): Promise<void> {
        const fileInput = document.querySelector('[data-id="file-input"]') as HTMLInputElement;
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return;
        }

        const files = Array.from(fileInput.files);

        // Hide dialog and start upload
        this.model.hideUploadDialog();
        this.model.setUploading(true);
        this.model.clearUploadError();
        this.view.update();

        // Process uploads in batches
        const collectionName = this.model.getCollectionName();
        const batchSize = BATCH_SIZE;
        const allResults: Array<{ file: File; success: boolean }> = [];

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file =>
                this.apiUploadImage(collectionName, file)
                    .then(() => ({ file, success: true }))
                    .catch(() => ({ file, success: false }))
            );

            // Wait for this batch to complete before moving to the next
            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults);
        }

        // Process results
        const failedFiles = allResults.filter(r => !r.success);

        if (failedFiles.length > 0) {
            this.model.setUploadError('Unable to upload some images');
        }

        // Finish upload
        this.model.setUploading(false);
        this.view.update();

        // Only reload the page if ALL uploads succeeded (no errors to display)
        if (allResults.some(r => r.success) && failedFiles.length === 0) {
            window.location.reload();
        }
    }


    private handleSlideshowButtonClick(): void {
        this.model.openSlideshow();
        this.view.update();
        this.startSlideshowTimer();
    }

    private startSlideshowTimer(): void {
        this.stopSlideshowTimer();

        this.slideshowTimer = setInterval(() => {
            if (!this.model.isSlideshowVisible()) {
                this.stopSlideshowTimer();
                return;
            }

            if (!this.model.isSlideshowPaused()) {
                this.model.advanceSlideshow();
                this.view.update();
            }
        }, SLIDESHOW_INTERVAL_MS);
    }

    private stopSlideshowTimer(): void {
        if (this.slideshowTimer !== null) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }

    private closeSlideshowAndCleanup(): void {
        this.stopSlideshowTimer();
        this.model.closeSlideshow();
        this.view.update();
    }

    private handlePopoverTabKeyPress(): void {
        const selectedImage = this.model.getSelectedImage();
        if (!selectedImage) return;

        const currentStatus = selectedImage.status;

        if (currentStatus === 'INBOX') {
            // Tab on INBOX image = Keep (move to COLLECTION)
            this.handleSingleImageStatusUpdate('COLLECTION');
        } else if (currentStatus === 'ARCHIVE') {
            // Tab on ARCHIVE image = Restore (move to COLLECTION)
            this.handleSingleImageStatusUpdate('COLLECTION');
        }
        // COLLECTION images do not respond to Tab key
    }

    private handlePopoverBackspaceKeyPress(): void {
        const selectedImage = this.model.getSelectedImage();
        if (!selectedImage) return;

        const currentStatus = selectedImage.status;

        if (currentStatus === 'INBOX' || currentStatus === 'COLLECTION') {
            // Backspace on INBOX or COLLECTION image = Discard (move to ARCHIVE)
            this.handleSingleImageStatusUpdate('ARCHIVE');
        }
        // ARCHIVE images do not respond to Backspace key
    }

    private async handleSingleImageStatusUpdate(newStatus: ImageStatus): Promise<void> {
        const selectedImage = this.model.getSelectedImage();
        if (!selectedImage) return;

        const collectionName = this.model.getCollectionName();
        const imageId = selectedImage.id;

        // Clear any previous status messages
        this.model.clearPopoverStatusMessage();

        try {
            // Make the API call
            await this.apiUpdateImageStatus(collectionName, imageId, newStatus);

            // Update was successful
            const successMessage = newStatus === 'COLLECTION' ? 'Image moved to COLLECTION' : 'Image moved to ARCHIVE';
            this.model.setPopoverStatusMessage(successMessage);
            this.view.update();

            // Update the image status in the model
            selectedImage.status = newStatus;

            // Wait for status message display, then remove updated image and advance to next
            setTimeout(() => {
                this.model.clearPopoverStatusMessage();
                this.model.removeImages([imageId]);
                this.model.advancePopoverToNext();
                this.view.update();
            }, STATUS_MESSAGE_DISPLAY_DURATION_MS);

        } catch {
            // Update failed
            this.model.setPopoverStatusMessage('Unable to update image status');
            this.view.update();

            // Hide error message after display duration (no advance)
            setTimeout(() => {
                this.model.clearPopoverStatusMessage();
                this.view.update();
            }, STATUS_MESSAGE_DISPLAY_DURATION_MS);
        }
    }
}