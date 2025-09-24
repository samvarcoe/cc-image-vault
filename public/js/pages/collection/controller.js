export default class CollectionPageController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.lastFocusedElement = null;
        this.slideshowTimer = null;
        this.init();
    }
    init() {
        this.attachEventListeners();
    }
    attachEventListeners() {
        document.addEventListener('click', (event) => {
            const slideshowButton = event.target.closest('[data-id="slideshow-button"]');
            if (slideshowButton && !slideshowButton.hasAttribute('disabled')) {
                this.handleSlideshowButtonClick();
            }
        });
        document.addEventListener('click', (event) => {
            const uploadButton = event.target.closest('[data-id="upload-button"]');
            if (uploadButton && !uploadButton.hasAttribute('disabled')) {
                this.handleUploadButtonClick();
            }
        });
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
            const keepButton = event.target.closest('[data-id="keep-button"]');
            if (keepButton && !keepButton.hasAttribute('disabled')) {
                this.handleKeepImages();
            }
        });
        document.addEventListener('click', (event) => {
            const discardButton = event.target.closest('[data-id="discard-button"]');
            if (discardButton && !discardButton.hasAttribute('disabled')) {
                this.handleDiscardImages();
            }
        });
        document.addEventListener('click', (event) => {
            const restoreButton = event.target.closest('[data-id="restore-button"]');
            if (restoreButton && !restoreButton.hasAttribute('disabled')) {
                this.handleRestoreImages();
            }
        });
        document.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('[data-id="delete-button"]');
            if (deleteButton && !deleteButton.hasAttribute('disabled')) {
                this.handleDeleteButtonClick();
            }
        });
        document.addEventListener('click', (event) => {
            const cancelButton = event.target.closest('[data-id="cancel-button"]');
            const confirmDeleteButton = event.target.closest('[data-id="confirm-delete-button"]');
            if (cancelButton) {
                const uploadDialog = cancelButton.closest('[data-id="upload-dialog"]');
                if (uploadDialog) {
                    this.handleUploadCancel();
                }
                else {
                    this.handleCancelDelete();
                }
            }
            else if (confirmDeleteButton) {
                this.handleConfirmDelete();
            }
        });
        document.addEventListener('click', (event) => {
            const addButton = event.target.closest('[data-id="add-button"]');
            if (addButton) {
                this.handleUploadAdd();
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
            if (event.key === 'Escape') {
                if (this.model.isSlideshowVisible()) {
                    this.closeSlideshowAndCleanup();
                }
                else if (this.model.isPopoverVisible()) {
                    this.closePopover();
                }
            }
            else if (event.key === ' ' && this.model.isSlideshowVisible()) {
                event.preventDefault();
                this.model.toggleSlideshowPause();
                this.view.update();
            }
            else if (event.key === 'Enter' && this.model.isSlideshowVisible()) {
                event.preventDefault();
                this.model.advanceSlideshow();
                this.view.update();
            }
        });
        document.addEventListener('error', (event) => {
            const image = event.target;
            if (image && image.closest('[data-id="popover-image"]')) {
                this.handleImageLoadError();
            }
            else if (image && image.closest('[data-id="slideshow-image"]')) {
                this.handleSlideshowImageLoadError();
            }
        }, true);
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
    handleSlideshowImageLoadError() {
        this.model.skipToNextImage();
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
    async handleKeepImages() {
        await this.updateImageStatus('COLLECTION');
    }
    async handleDiscardImages() {
        await this.updateImageStatus('ARCHIVE');
    }
    async handleRestoreImages() {
        await this.updateImageStatus('COLLECTION');
    }
    async updateImageStatus(newStatus) {
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }
        this.model.clearStatusUpdateError();
        this.model.hideSelectedImages();
        this.view.update();
        const collectionName = this.model.getCollectionName();
        const batchSize = 10;
        const allResults = [];
        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId => this.sendStatusUpdateRequest(collectionName, imageId, newStatus)
                .then(() => ({ imageId, success: true }))
                .catch(() => ({ imageId, success: false })));
            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults);
        }
        const successfulIds = allResults.filter(r => r.success).map(r => r.imageId);
        const failedIds = allResults.filter(r => !r.success).map(r => r.imageId);
        if (successfulIds.length > 0) {
            this.model.removeImages(successfulIds);
        }
        if (failedIds.length > 0) {
            this.model.unhideImages(failedIds);
            this.model.setStatusUpdateError('Unable to complete update for all Images');
        }
        this.view.update();
    }
    async sendStatusUpdateRequest(collectionName, imageId, status) {
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
    handleDeleteButtonClick() {
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }
        this.model.showConfirmationDialog('Are you sure you want to permanently delete these images? This action cannot be undone.');
        this.view.update();
    }
    handleCancelDelete() {
        this.model.hideConfirmationDialog();
        this.view.update();
    }
    async handleConfirmDelete() {
        this.model.hideConfirmationDialog();
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }
        this.model.clearStatusUpdateError();
        this.model.hideSelectedImages();
        this.view.update();
        const collectionName = this.model.getCollectionName();
        const batchSize = 10;
        const allResults = [];
        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId => this.sendDeleteRequest(collectionName, imageId)
                .then(() => ({ imageId, success: true }))
                .catch(() => ({ imageId, success: false })));
            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults);
        }
        const successfulIds = allResults.filter(r => r.success).map(r => r.imageId);
        const failedIds = allResults.filter(r => !r.success).map(r => r.imageId);
        if (successfulIds.length > 0) {
            this.model.removeImages(successfulIds);
        }
        if (failedIds.length > 0) {
            this.model.unhideImages(failedIds);
            if (failedIds.length === allResults.length) {
                this.model.setStatusUpdateError('Unable to delete images');
            }
            else {
                this.model.setStatusUpdateError('Unable to delete all images');
            }
        }
        this.view.update();
    }
    async sendDeleteRequest(collectionName, imageId) {
        const response = await fetch(`/api/images/${collectionName}/${imageId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Failed to delete image ${imageId}`);
        }
    }
    handleUploadButtonClick() {
        this.model.showUploadDialog();
        this.view.update();
    }
    handleUploadCancel() {
        this.model.hideUploadDialog();
        this.view.update();
    }
    async handleUploadAdd() {
        const fileInput = document.querySelector('[data-id="file-input"]');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return;
        }
        const files = Array.from(fileInput.files);
        this.model.hideUploadDialog();
        this.model.setUploading(true);
        this.model.clearUploadError();
        this.view.update();
        const collectionName = this.model.getCollectionName();
        const batchSize = 10;
        const allResults = [];
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file => this.uploadFile(collectionName, file)
                .then(() => ({ file, success: true }))
                .catch(() => ({ file, success: false })));
            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults);
        }
        const failedFiles = allResults.filter(r => !r.success);
        if (failedFiles.length > 0) {
            this.model.setUploadError('Unable to upload some images');
        }
        this.model.setUploading(false);
        this.view.update();
        if (allResults.some(r => r.success) && failedFiles.length === 0) {
            window.location.reload();
        }
    }
    async uploadFile(collectionName, file) {
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
    handleSlideshowButtonClick() {
        this.model.openSlideshow();
        this.view.update();
        this.startSlideshowTimer();
    }
    startSlideshowTimer() {
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
        }, 5000);
    }
    stopSlideshowTimer() {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }
    closeSlideshowAndCleanup() {
        this.stopSlideshowTimer();
        this.model.closeSlideshow();
        this.view.update();
    }
}
