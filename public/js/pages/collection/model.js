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
        var _a;
        return (_a = this.data.name) !== null && _a !== void 0 ? _a : '';
    }
    getCurrentStatus() {
        var _a;
        return (_a = this.data.status) !== null && _a !== void 0 ? _a : 'COLLECTION';
    }
    getImages() {
        var _a;
        return (_a = this.data.images) !== null && _a !== void 0 ? _a : [];
    }
    ensurePopover() {
        if (!this.data.popover) {
            this.data.popover = {
                visible: false,
                selectedImageId: undefined,
                error: undefined,
                statusMessage: undefined
            };
        }
        return this.data.popover;
    }
    hasImages() {
        return (this.data.images || []).length > 0;
    }
    hasError() {
        return !!this.data.error;
    }
    getErrorMessage() {
        return this.data.error || '';
    }
    isLoading() {
        return this.data.loading || false;
    }
    isPopoverVisible() {
        var _a, _b;
        return (_b = (_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.visible) !== null && _b !== void 0 ? _b : false;
    }
    getSelectedImageId() {
        var _a;
        return (_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.selectedImageId;
    }
    getSelectedImage() {
        const selectedId = this.getSelectedImageId();
        if (!selectedId)
            return undefined;
        return this.getImages().find(img => img.id === selectedId);
    }
    getPopoverError() {
        var _a;
        return (_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.error;
    }
    getPopoverStatusMessage() {
        var _a;
        return (_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.statusMessage;
    }
    setPopoverStatusMessage(message) {
        const popover = this.ensurePopover();
        popover.statusMessage = message;
    }
    clearPopoverStatusMessage() {
        const popover = this.ensurePopover();
        popover.statusMessage = undefined;
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
        if (this.data.popover) {
            this.data.popover.error = message;
        }
    }
    advancePopoverToNext() {
        var _a;
        if (!this.isPopoverVisible() || !((_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.selectedImageId)) {
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
        var _a;
        if (!this.isPopoverVisible() || !((_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.selectedImageId)) {
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
        return this.data.curate || false;
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
        return this.data.selectedImageIds || [];
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
        return this.data.statusUpdateError || '';
    }
    setStatusUpdateError(error) {
        this.data.statusUpdateError = error;
    }
    clearStatusUpdateError() {
        this.data.statusUpdateError = '';
    }
    getHiddenImageIds() {
        return this.data.hiddenImageIds || [];
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
        this.data.images = (this.data.images || []).filter(img => !imageIds.includes(img.id));
        this.data.hiddenImageIds = (this.data.hiddenImageIds || []).filter(id => !imageIds.includes(id));
        this.data.selectedImageIds = (this.data.selectedImageIds || []).filter(id => !imageIds.includes(id));
    }
    getProcessingImageIds() {
        return this.data.processingImageIds || [];
    }
    setProcessingImageIds(imageIds) {
        this.data.processingImageIds = imageIds;
    }
    clearProcessingImageIds() {
        this.data.processingImageIds = [];
    }
    ensureConfirmationDialog() {
        if (!this.data.confirmationDialog) {
            this.data.confirmationDialog = {
                visible: false,
                message: undefined
            };
        }
        return this.data.confirmationDialog;
    }
    ensureUploadDialog() {
        if (!this.data.uploadDialog) {
            this.data.uploadDialog = {
                visible: false
            };
        }
        return this.data.uploadDialog;
    }
    isConfirmationDialogVisible() {
        var _a, _b;
        return (_b = (_a = this.data.confirmationDialog) === null || _a === void 0 ? void 0 : _a.visible) !== null && _b !== void 0 ? _b : false;
    }
    getConfirmationDialogMessage() {
        var _a, _b;
        return (_b = (_a = this.data.confirmationDialog) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : '';
    }
    showConfirmationDialog(message) {
        const dialog = this.ensureConfirmationDialog();
        dialog.visible = true;
        dialog.message = message;
    }
    hideConfirmationDialog() {
        const dialog = this.ensureConfirmationDialog();
        dialog.visible = false;
        dialog.message = undefined;
    }
    isUploadDialogVisible() {
        var _a, _b;
        return (_b = (_a = this.data.uploadDialog) === null || _a === void 0 ? void 0 : _a.visible) !== null && _b !== void 0 ? _b : false;
    }
    showUploadDialog() {
        const dialog = this.ensureUploadDialog();
        dialog.visible = true;
    }
    hideUploadDialog() {
        const dialog = this.ensureUploadDialog();
        dialog.visible = false;
    }
    ensureUpload() {
        if (!this.data.upload) {
            this.data.upload = {
                isUploading: false,
                error: undefined
            };
        }
        return this.data.upload;
    }
    isUploading() {
        var _a, _b;
        return (_b = (_a = this.data.upload) === null || _a === void 0 ? void 0 : _a.isUploading) !== null && _b !== void 0 ? _b : false;
    }
    setUploading(isUploading) {
        const upload = this.ensureUpload();
        upload.isUploading = isUploading;
    }
    getUploadError() {
        var _a;
        return (_a = this.data.upload) === null || _a === void 0 ? void 0 : _a.error;
    }
    setUploadError(error) {
        const upload = this.ensureUpload();
        upload.error = error;
    }
    clearUploadError() {
        const upload = this.ensureUpload();
        upload.error = undefined;
    }
    ensureSlideshow() {
        if (!this.data.slideshow) {
            this.data.slideshow = {
                visible: false,
                currentImageId: undefined,
                isPaused: false,
                imageSequence: [],
                currentIndex: 0
            };
        }
        return this.data.slideshow;
    }
    isSlideshowVisible() {
        var _a, _b;
        return (_b = (_a = this.data.slideshow) === null || _a === void 0 ? void 0 : _a.visible) !== null && _b !== void 0 ? _b : false;
    }
    openSlideshow() {
        const images = this.getImages();
        if (images.length === 0) {
            return;
        }
        const imageIds = images.map(img => img.id);
        const shuffledIds = this.shuffleArray([...imageIds]);
        const slideshow = this.ensureSlideshow();
        slideshow.visible = true;
        slideshow.currentImageId = shuffledIds[0];
        slideshow.isPaused = false;
        slideshow.imageSequence = shuffledIds;
        slideshow.currentIndex = 0;
    }
    closeSlideshow() {
        const slideshow = this.ensureSlideshow();
        slideshow.visible = false;
        slideshow.currentImageId = undefined;
        slideshow.isPaused = false;
        slideshow.imageSequence = [];
        slideshow.currentIndex = 0;
    }
    getCurrentSlideshowImageId() {
        var _a;
        return (_a = this.data.slideshow) === null || _a === void 0 ? void 0 : _a.currentImageId;
    }
    isSlideshowPaused() {
        var _a, _b;
        return (_b = (_a = this.data.slideshow) === null || _a === void 0 ? void 0 : _a.isPaused) !== null && _b !== void 0 ? _b : false;
    }
    pauseSlideshow() {
        const slideshow = this.ensureSlideshow();
        slideshow.isPaused = true;
    }
    resumeSlideshow() {
        const slideshow = this.ensureSlideshow();
        slideshow.isPaused = false;
    }
    toggleSlideshowPause() {
        const slideshow = this.ensureSlideshow();
        slideshow.isPaused = !slideshow.isPaused;
    }
    advanceSlideshow() {
        const slideshow = this.ensureSlideshow();
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
        const slideshow = this.ensureSlideshow();
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
