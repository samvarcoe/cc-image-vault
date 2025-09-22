import { Model } from '../../mvc.js';
export default class CollectionPageModel extends Model {
    constructor(initialData = {}) {
        super(Object.assign({ name: '', status: 'COLLECTION', images: [], error: '', loading: false, curate: false, selectedImageIds: [], hiddenImageIds: [], statusUpdateError: '', processingImageIds: [], popover: {
                visible: false,
                selectedImageId: undefined,
                error: undefined
            }, confirmationDialog: {
                visible: false,
                message: undefined
            } }, initialData));
    }
    getCollectionName() {
        return this.data.name || '';
    }
    getCurrentStatus() {
        return this.data.status || 'COLLECTION';
    }
    getImages() {
        return this.data.images || [];
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
        var _a;
        return ((_a = this.data.popover) === null || _a === void 0 ? void 0 : _a.visible) || false;
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
    openPopover(imageId) {
        this.data.popover = {
            visible: true,
            selectedImageId: imageId,
            error: undefined
        };
    }
    closePopover() {
        this.data.popover = {
            visible: false,
            selectedImageId: undefined,
            error: undefined
        };
    }
    setPopoverError(message) {
        if (this.data.popover) {
            this.data.popover.error = message;
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
    isConfirmationDialogVisible() {
        var _a;
        return ((_a = this.data.confirmationDialog) === null || _a === void 0 ? void 0 : _a.visible) || false;
    }
    getConfirmationDialogMessage() {
        var _a;
        return ((_a = this.data.confirmationDialog) === null || _a === void 0 ? void 0 : _a.message) || '';
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
}
