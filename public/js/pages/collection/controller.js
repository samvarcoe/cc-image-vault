const SLIDESHOW_INTERVAL_MS = 5000;
const STATUS_MESSAGE_DISPLAY_DURATION_MS = 500;
const BATCH_SIZE = 10;
export default class CollectionPageController {
    async apiUpdateImageStatus(collectionName, imageId, status) {
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
    async apiDeleteImage(collectionName, imageId) {
        const response = await fetch(`/api/images/${collectionName}/${imageId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Failed to delete image ${imageId}`);
        }
    }
    async apiUploadImage(collectionName, file) {
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
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.lastFocusedElement = null;
        this.slideshowTimer = null;
        this.eventListeners = [];
        this.init();
    }
    init() {
        this.attachEventListeners();
        this.attachUnloadHandler();
    }
    cleanup() {
        this.stopSlideshowTimer();
        this.removeAllEventListeners();
    }
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
    }
    addEventListener(element, type, handler, options) {
        element.addEventListener(type, handler, options);
        this.eventListeners.push({ element, type, handler });
    }
    getImageIdFromElement(element) {
        const imageCard = element === null || element === void 0 ? void 0 : element.closest('[data-image-id]');
        return (imageCard === null || imageCard === void 0 ? void 0 : imageCard.dataset.imageId) || null;
    }
    getButtonElement(target, selector) {
        var _a;
        return ((_a = target === null || target === void 0 ? void 0 : target.closest) === null || _a === void 0 ? void 0 : _a.call(target, selector)) || null;
    }
    attachUnloadHandler() {
        this.addEventListener(window, 'beforeunload', (event) => {
            if (this.model.isUploading()) {
                const message = 'Upload currently in progress, pending image uploads will be canceled if you leave the page';
                event.preventDefault();
                event.returnValue = message;
                return message;
            }
            return undefined;
        });
        this.addEventListener(window, 'unload', () => {
            this.cleanup();
        });
    }
    attachEventListeners() {
        this.addEventListener(document, 'click', (event) => {
            const slideshowButton = this.getButtonElement(event.target, '[data-id="slideshow-button"]');
            if (slideshowButton && !slideshowButton.hasAttribute('disabled')) {
                this.handleSlideshowButtonClick();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const uploadButton = this.getButtonElement(event.target, '[data-id="upload-button"]');
            if (uploadButton && !uploadButton.hasAttribute('disabled')) {
                this.handleUploadButtonClick();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const curateButton = event.target.closest('[data-id="curate-button"]');
            if (curateButton) {
                this.toggleCurateMode();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const selectAllButton = event.target.closest('[data-id="select-all-button"]');
            if (selectAllButton) {
                this.selectAllImages();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const clearButton = event.target.closest('[data-id="clear-button"]');
            if (clearButton) {
                this.clearSelection();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const keepButton = event.target.closest('[data-id="keep-button"]');
            if (keepButton && !keepButton.hasAttribute('disabled')) {
                this.handleKeepImages();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const discardButton = event.target.closest('[data-id="discard-button"]');
            if (discardButton && !discardButton.hasAttribute('disabled')) {
                this.handleDiscardImages();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const restoreButton = event.target.closest('[data-id="restore-button"]');
            if (restoreButton && !restoreButton.hasAttribute('disabled')) {
                this.handleRestoreImages();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const deleteButton = event.target.closest('[data-id="delete-button"]');
            if (deleteButton && !deleteButton.hasAttribute('disabled')) {
                this.handleDeleteButtonClick();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const downloadButton = event.target.closest('[data-id="download-button"]');
            if (downloadButton && !downloadButton.hasAttribute('disabled')) {
                this.handleDownloadImages();
            }
        });
        this.addEventListener(document, 'click', (event) => {
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
        this.addEventListener(document, 'click', (event) => {
            const addButton = event.target.closest('[data-id="add-button"]');
            if (addButton) {
                this.handleUploadAdd();
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const imageId = this.getImageIdFromElement(event.target);
            if (imageId) {
                const imageCard = event.target.closest('[data-image-id]');
                if (this.model.isCurateMode()) {
                    this.toggleImageSelection(imageId);
                }
                else if (imageCard) {
                    this.openPopover(imageId, imageCard);
                }
            }
        });
        this.addEventListener(document, 'click', (event) => {
            const popover = event.target.closest('[data-id="fullscreen-popover"]');
            if (popover) {
                this.closePopover();
            }
        });
        this.addEventListener(document, 'keydown', (event) => {
            const keyboardEvent = event;
            if (keyboardEvent.key === 'Escape') {
                if (this.model.isSlideshowVisible()) {
                    this.closeSlideshowAndCleanup();
                }
                else if (this.model.isPopoverVisible()) {
                    this.closePopover();
                }
            }
            else if (keyboardEvent.key === ' ' && this.model.isSlideshowVisible()) {
                keyboardEvent.preventDefault();
                this.model.toggleSlideshowPause();
                this.view.update();
            }
            else if (keyboardEvent.key === 'Enter') {
                if (this.model.isSlideshowVisible()) {
                    keyboardEvent.preventDefault();
                    this.model.advanceSlideshow();
                    this.view.update();
                }
                else if (this.model.isPopoverVisible()) {
                    keyboardEvent.preventDefault();
                    this.model.advancePopoverToNext();
                    this.view.update();
                }
            }
            else if (keyboardEvent.key === 'Tab' && this.model.isPopoverVisible()) {
                keyboardEvent.preventDefault();
                this.handlePopoverTabKeyPress();
            }
            else if (keyboardEvent.key === 'Backspace' && this.model.isPopoverVisible()) {
                keyboardEvent.preventDefault();
                this.handlePopoverBackspaceKeyPress();
            }
        });
        this.addEventListener(document, 'error', (event) => {
            const image = event.target;
            if (image && image.closest('[data-id="popover-image"]')) {
                this.handleImageLoadError();
            }
            else if (image && image.closest('[data-id="slideshow-image"]')) {
                this.handleSlideshowImageLoadError();
            }
        }, { capture: true });
        this.addEventListener(document, 'wheel', (event) => {
            const wheelEvent = event;
            if (!this.model.isPopoverVisible()) {
                return;
            }
            const popover = wheelEvent.target.closest('[data-id="fullscreen-popover"]');
            if (popover) {
                wheelEvent.preventDefault();
                if (wheelEvent.deltaY > 0) {
                    this.model.advancePopoverToNext();
                    this.view.update();
                }
                else if (wheelEvent.deltaY < 0) {
                    this.model.advancePopoverToPrevious();
                    this.view.update();
                }
            }
        }, { passive: false });
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
        const batchSize = BATCH_SIZE;
        const allResults = [];
        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId => this.apiUpdateImageStatus(collectionName, imageId, newStatus)
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
        const batchSize = BATCH_SIZE;
        const allResults = [];
        for (let i = 0; i < selectedImageIds.length; i += batchSize) {
            const batch = selectedImageIds.slice(i, i + batchSize);
            const batchPromises = batch.map(imageId => this.apiDeleteImage(collectionName, imageId)
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
    async handleDownloadImages() {
        const selectedImageIds = this.model.getSelectedImageIds();
        if (selectedImageIds.length === 0) {
            return;
        }
        this.model.clearStatusUpdateError();
        this.model.setDownloading(true);
        this.view.update();
        try {
            const collectionName = this.model.getCollectionName();
            const currentStatus = this.model.getCurrentStatus();
            if (selectedImageIds.length === 1) {
                const imageId = selectedImageIds[0];
                await this.downloadSingleImage(collectionName, imageId);
            }
            else {
                const archiveName = `${collectionName}-${currentStatus}-images`;
                await this.downloadMultipleImages(collectionName, selectedImageIds, archiveName);
            }
        }
        catch (error) {
            console.error('Download error:', error);
            this.model.setStatusUpdateError('Unable to download image(s)');
        }
        finally {
            this.model.setDownloading(false);
            this.view.update();
        }
    }
    async downloadSingleImage(collectionName, imageId) {
        const url = `/api/images/${collectionName}/${imageId}/download`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Download failed with status ${response.status}`);
        }
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = imageId;
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
    async downloadMultipleImages(collectionName, imageIds, archiveName) {
        const url = `/api/images/${collectionName}/download`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageIds, archiveName })
        });
        if (!response.ok) {
            throw new Error(`Download failed with status ${response.status}`);
        }
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `${archiveName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objectUrl);
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
        const batchSize = BATCH_SIZE;
        const allResults = [];
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file => this.apiUploadImage(collectionName, file)
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
        }, SLIDESHOW_INTERVAL_MS);
    }
    stopSlideshowTimer() {
        if (this.slideshowTimer !== null) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }
    closeSlideshowAndCleanup() {
        this.stopSlideshowTimer();
        this.model.closeSlideshow();
        this.view.update();
    }
    handlePopoverTabKeyPress() {
        const selectedImage = this.model.getSelectedImage();
        if (!selectedImage)
            return;
        const currentStatus = selectedImage.status;
        if (currentStatus === 'INBOX') {
            this.handleSingleImageStatusUpdate('COLLECTION');
        }
        else if (currentStatus === 'ARCHIVE') {
            this.handleSingleImageStatusUpdate('COLLECTION');
        }
    }
    handlePopoverBackspaceKeyPress() {
        const selectedImage = this.model.getSelectedImage();
        if (!selectedImage)
            return;
        const currentStatus = selectedImage.status;
        if (currentStatus === 'INBOX' || currentStatus === 'COLLECTION') {
            this.handleSingleImageStatusUpdate('ARCHIVE');
        }
    }
    async handleSingleImageStatusUpdate(newStatus) {
        const selectedImage = this.model.getSelectedImage();
        if (!selectedImage)
            return;
        const collectionName = this.model.getCollectionName();
        const imageId = selectedImage.id;
        this.model.clearPopoverStatusMessage();
        try {
            await this.apiUpdateImageStatus(collectionName, imageId, newStatus);
            const successMessage = newStatus === 'COLLECTION' ? 'Image moved to COLLECTION' : 'Image moved to ARCHIVE';
            this.model.setPopoverStatusMessage(successMessage);
            this.view.update();
            selectedImage.status = newStatus;
            setTimeout(() => {
                this.model.clearPopoverStatusMessage();
                this.model.removeImages([imageId]);
                this.model.advancePopoverToNext();
                this.view.update();
            }, STATUS_MESSAGE_DISPLAY_DURATION_MS);
        }
        catch (_a) {
            this.model.setPopoverStatusMessage('Unable to update image status');
            this.view.update();
            setTimeout(() => {
                this.model.clearPopoverStatusMessage();
                this.view.update();
            }, STATUS_MESSAGE_DISPLAY_DURATION_MS);
        }
    }
}
