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
        // Handle upload button clicks
        document.addEventListener('click', (event) => {
            const uploadButton = (event.target as Element).closest('[data-id="upload-button"]');
            if (uploadButton && !uploadButton.hasAttribute('disabled')) {
                this.handleUploadButtonClick();
            }
        });

        // Handle curate button clicks
        document.addEventListener('click', (event) => {
            const curateButton = (event.target as Element).closest('[data-id="curate-button"]');
            if (curateButton) {
                this.toggleCurateMode();
            }
        });

        // Handle Select All button clicks
        document.addEventListener('click', (event) => {
            const selectAllButton = (event.target as Element).closest('[data-id="select-all-button"]');
            if (selectAllButton) {
                this.selectAllImages();
            }
        });

        // Handle Clear button clicks
        document.addEventListener('click', (event) => {
            const clearButton = (event.target as Element).closest('[data-id="clear-button"]');
            if (clearButton) {
                this.clearSelection();
            }
        });

        // Handle Keep button clicks
        document.addEventListener('click', (event) => {
            const keepButton = (event.target as Element).closest('[data-id="keep-button"]');
            if (keepButton && !keepButton.hasAttribute('disabled')) {
                this.handleKeepImages();
            }
        });

        // Handle Discard button clicks
        document.addEventListener('click', (event) => {
            const discardButton = (event.target as Element).closest('[data-id="discard-button"]');
            if (discardButton && !discardButton.hasAttribute('disabled')) {
                this.handleDiscardImages();
            }
        });

        // Handle Restore button clicks
        document.addEventListener('click', (event) => {
            const restoreButton = (event.target as Element).closest('[data-id="restore-button"]');
            if (restoreButton && !restoreButton.hasAttribute('disabled')) {
                this.handleRestoreImages();
            }
        });

        // Handle Delete button clicks
        document.addEventListener('click', (event) => {
            const deleteButton = (event.target as Element).closest('[data-id="delete-button"]');
            if (deleteButton && !deleteButton.hasAttribute('disabled')) {
                this.handleDeleteButtonClick();
            }
        });

        // Handle confirmation dialog button clicks
        document.addEventListener('click', (event) => {
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
        document.addEventListener('click', (event) => {
            const addButton = (event.target as Element).closest('[data-id="add-button"]');
            if (addButton) {
                this.handleUploadAdd();
            }
        });

        // Handle image card clicks to open popover (only if not in curate mode) or toggle selection (if in curate mode)
        document.addEventListener('click', (event) => {
            const imageCard = (event.target as Element).closest('[data-image-id]') as HTMLElement;
            if (imageCard) {
                const imageId = imageCard.dataset.imageId;
                if (imageId) {
                    if (this.model.isCurateMode()) {
                        this.toggleImageSelection(imageId);
                    } else {
                        this.openPopover(imageId, imageCard);
                    }
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

        // Handle navigation warning during upload
        window.addEventListener('beforeunload', (event) => {
            if (this.model.isUploading()) {
                const message = 'Upload currently in progress, pending image uploads will be canceled if you leave the page';
                event.preventDefault();
                event.returnValue = message;
                return message;
            }
            return undefined;
        });
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

        // Batch the requests (max 10 concurrent)
        const collectionName = this.model.getCollectionName();
        const batchSize = 10;
        const allResults: Array<{ imageId: string; success: boolean }> = [];

        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId =>
                this.sendStatusUpdateRequest(collectionName, imageId, newStatus)
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

    private async sendStatusUpdateRequest(collectionName: string, imageId: string, status: ImageStatus): Promise<void> {
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

        // Batch the delete requests (max 10 concurrent)
        const collectionName = this.model.getCollectionName();
        const batchSize = 10;
        const allResults: Array<{ imageId: string; success: boolean }> = [];

        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId =>
                this.sendDeleteRequest(collectionName, imageId)
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

    private async sendDeleteRequest(collectionName: string, imageId: string): Promise<void> {
        const response = await fetch(`/api/images/${collectionName}/${imageId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete image ${imageId}`);
        }
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

        // Process uploads in batches of 10
        const collectionName = this.model.getCollectionName();
        const batchSize = 10;
        const allResults: Array<{ file: File; success: boolean }> = [];

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file =>
                this.uploadFile(collectionName, file)
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

    private async uploadFile(collectionName: string, file: File): Promise<void> {
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
}