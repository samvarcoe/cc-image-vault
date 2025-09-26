import { Model } from '../../mvc.js';
export default class CollectionPageModel extends Model {
    constructor(initialData = {}) {
        super(Object.assign({ name: '', status: 'COLLECTION', images: [], error: '', loading: false, curate: false, selectedImageIds: [], hiddenImageIds: [], statusUpdateError: '', processingImageIds: [], popover: {
                visible: false,
                selectedImageId: undefined,
                error: undefined,
                statusMessage: undefined
            }, confirmationDialog: {
                visible: false,
                message: undefined
            }, uploadDialog: {
                visible: false
            }, upload: {
                isUploading: false,
                error: undefined
            }, slideshow: {
                visible: false,
                currentImageId: undefined,
                isPaused: false,
                imageSequence: [],
                currentIndex: 0
            } }, initialData));
    }
    getCollectionName() {
        return this.data.name;
    }
    getCurrentStatus() {
        return this.data.status;
    }
    getImages() {
        return this.data.images;
    }
    hasImages() {
        return this.data.images.length > 0;
    }
    hasError() {
        return !!this.data.error;
    }
    getErrorMessage() {
        return this.data.error;
    }
    isLoading() {
        return this.data.loading;
    }
    isPopoverVisible() {
        return this.data.popover.visible;
    }
    getSelectedImageId() {
        return this.data.popover.selectedImageId;
    }
    getSelectedImage() {
        const selectedId = this.getSelectedImageId();
        if (!selectedId)
            return undefined;
        return this.getImages().find(img => img.id === selectedId);
    }
    getPopoverError() {
        return this.data.popover.error;
    }
    getPopoverStatusMessage() {
        return this.data.popover.statusMessage;
    }
    setPopoverStatusMessage(message) {
        this.data.popover.statusMessage = message;
    }
    clearPopoverStatusMessage() {
        this.data.popover.statusMessage = undefined;
    }
    openPopover(imageId) {
        this.data.popover = {
            visible: true,
            selectedImageId: imageId,
            error: undefined,
            statusMessage: undefined
        };
    }
    closePopover() {
        this.data.popover = {
            visible: false,
            selectedImageId: undefined,
            error: undefined,
            statusMessage: undefined
        };
    }
    setPopoverError(message) {
        this.data.popover.error = message;
    }
    advancePopoverToNext() {
        if (!this.isPopoverVisible() || !this.data.popover.selectedImageId) {
            return;
        }
        const images = this.getImages();
        if (images.length === 0) {
            this.closePopover();
            return;
        }
        const currentImageId = this.data.popover.selectedImageId;
        const currentIndex = images.findIndex(img => img.id === currentImageId);
        if (currentIndex === -1) {
            const firstImage = images[0];
            if (firstImage) {
                this.data.popover.selectedImageId = firstImage.id;
                this.data.popover.error = undefined;
                this.data.popover.statusMessage = undefined;
            }
            return;
        }
        const nextIndex = (currentIndex + 1) % images.length;
        const nextImage = images[nextIndex];
        if (nextImage) {
            this.data.popover.selectedImageId = nextImage.id;
            this.data.popover.error = undefined;
            this.data.popover.statusMessage = undefined;
        }
    }
    advancePopoverToPrevious() {
        if (!this.isPopoverVisible() || !this.data.popover.selectedImageId) {
            return;
        }
        const currentImageId = this.data.popover.selectedImageId;
        const images = this.getImages();
        const currentIndex = images.findIndex(img => img.id === currentImageId);
        if (currentIndex === -1) {
            return;
        }
        const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        const prevImage = images[prevIndex];
        if (prevImage) {
            this.data.popover.selectedImageId = prevImage.id;
            this.data.popover.error = undefined;
            this.data.popover.statusMessage = undefined;
        }
    }
    isCurateMode() {
        return this.data.curate;
    }
    setCurateMode(curate) {
        this.data.curate = curate;
    }
    toggleCurateMode() {
        this.data.curate = !this.data.curate;
        if (!this.data.curate) {
            this.clearSelection();
        }
    }
    getSelectedImageIds() {
        return this.data.selectedImageIds;
    }
    isImageSelected(imageId) {
        return this.getSelectedImageIds().includes(imageId);
    }
    selectImage(imageId) {
        const selectedIds = this.getSelectedImageIds();
        if (!selectedIds.includes(imageId)) {
            this.data.selectedImageIds = [...selectedIds, imageId];
        }
    }
    deselectImage(imageId) {
        const selectedIds = this.getSelectedImageIds();
        this.data.selectedImageIds = selectedIds.filter(id => id !== imageId);
    }
    toggleImageSelection(imageId) {
        if (this.isImageSelected(imageId)) {
            this.deselectImage(imageId);
        }
        else {
            this.selectImage(imageId);
        }
    }
    selectAllImages() {
        const allImageIds = this.getImages().map(image => image.id);
        this.data.selectedImageIds = [...allImageIds];
    }
    clearSelection() {
        this.data.selectedImageIds = [];
    }
    hasSelectedImages() {
        return this.getSelectedImageIds().length > 0;
    }
    getStatusUpdateError() {
        return this.data.statusUpdateError;
    }
    setStatusUpdateError(error) {
        this.data.statusUpdateError = error;
    }
    clearStatusUpdateError() {
        this.data.statusUpdateError = '';
    }
    getHiddenImageIds() {
        return this.data.hiddenImageIds;
    }
    isImageHidden(imageId) {
        return this.getHiddenImageIds().includes(imageId);
    }
    hideSelectedImages() {
        const selectedIds = this.getSelectedImageIds();
        this.data.hiddenImageIds = [...new Set([...this.getHiddenImageIds(), ...selectedIds])];
    }
    unhideImages(imageIds) {
        const hiddenIds = this.getHiddenImageIds();
        this.data.hiddenImageIds = hiddenIds.filter(id => !imageIds.includes(id));
    }
    removeImages(imageIds) {
        this.data.images = this.data.images.filter(img => !imageIds.includes(img.id));
        this.data.hiddenImageIds = this.data.hiddenImageIds.filter(id => !imageIds.includes(id));
        this.data.selectedImageIds = this.data.selectedImageIds.filter(id => !imageIds.includes(id));
    }
    getProcessingImageIds() {
        return this.data.processingImageIds;
    }
    setProcessingImageIds(imageIds) {
        this.data.processingImageIds = imageIds;
    }
    clearProcessingImageIds() {
        this.data.processingImageIds = [];
    }
    isConfirmationDialogVisible() {
        return this.data.confirmationDialog.visible;
    }
    getConfirmationDialogMessage() {
        var _a;
        return (_a = this.data.confirmationDialog.message) !== null && _a !== void 0 ? _a : '';
    }
    showConfirmationDialog(message) {
        this.data.confirmationDialog = {
            visible: true,
            message: message
        };
    }
    hideConfirmationDialog() {
        this.data.confirmationDialog = {
            visible: false,
            message: undefined
        };
    }
    isUploadDialogVisible() {
        return this.data.uploadDialog.visible;
    }
    showUploadDialog() {
        this.data.uploadDialog.visible = true;
    }
    hideUploadDialog() {
        this.data.uploadDialog.visible = false;
    }
    isUploading() {
        return this.data.upload.isUploading;
    }
    setUploading(isUploading) {
        this.data.upload.isUploading = isUploading;
    }
    getUploadError() {
        return this.data.upload.error;
    }
    setUploadError(error) {
        this.data.upload.error = error;
    }
    clearUploadError() {
        this.data.upload.error = undefined;
    }
    isSlideshowVisible() {
        return this.data.slideshow.visible;
    }
    openSlideshow() {
        const images = this.getImages();
        if (images.length === 0) {
            return;
        }
        const imageIds = images.map(img => img.id);
        const shuffledIds = this.shuffleArray([...imageIds]);
        this.data.slideshow = {
            visible: true,
            currentImageId: shuffledIds[0],
            isPaused: false,
            imageSequence: shuffledIds,
            currentIndex: 0
        };
    }
    closeSlideshow() {
        this.data.slideshow = {
            visible: false,
            currentImageId: undefined,
            isPaused: false,
            imageSequence: [],
            currentIndex: 0
        };
    }
    getCurrentSlideshowImageId() {
        return this.data.slideshow.currentImageId;
    }
    isSlideshowPaused() {
        return this.data.slideshow.isPaused;
    }
    pauseSlideshow() {
        this.data.slideshow.isPaused = true;
    }
    resumeSlideshow() {
        this.data.slideshow.isPaused = false;
    }
    toggleSlideshowPause() {
        this.data.slideshow.isPaused = !this.data.slideshow.isPaused;
    }
    advanceSlideshow() {
        const slideshow = this.data.slideshow;
        if (slideshow.imageSequence.length === 0) {
            return;
        }
        const nextIndex = slideshow.currentIndex + 1;
        if (nextIndex >= slideshow.imageSequence.length) {
            const images = this.getImages();
            const imageIds = images.map(img => img.id);
            const shuffledIds = this.shuffleArray([...imageIds]);
            slideshow.imageSequence = shuffledIds;
            slideshow.currentIndex = 0;
            slideshow.currentImageId = shuffledIds[0];
        }
        else {
            slideshow.currentIndex = nextIndex;
            slideshow.currentImageId = slideshow.imageSequence[nextIndex];
        }
    }
    skipToNextImage() {
        const slideshow = this.data.slideshow;
        if (slideshow.imageSequence.length === 0) {
            return;
        }
        const currentImageId = slideshow.currentImageId;
        slideshow.imageSequence = slideshow.imageSequence.filter(id => id !== currentImageId);
        if (slideshow.imageSequence.length === 0) {
            const images = this.getImages();
            const imageIds = images.map(img => img.id).filter(id => id !== currentImageId);
            slideshow.imageSequence = this.shuffleArray([...imageIds]);
            slideshow.currentIndex = 0;
        }
        else {
            if (slideshow.currentIndex >= slideshow.imageSequence.length) {
                slideshow.currentIndex = 0;
            }
        }
        if (slideshow.imageSequence.length > 0) {
            slideshow.currentImageId = slideshow.imageSequence[slideshow.currentIndex];
        }
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }
}
