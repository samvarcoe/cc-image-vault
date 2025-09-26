import { Model } from '../../mvc.js';

export interface CollectionPageData {
    name?: string;
    status?: ImageStatus;
    images?: ImageMetadata[];
    error?: string;
    loading?: boolean;
    curate?: boolean;
    selectedImageIds?: string[];
    hiddenImageIds?: string[];
    statusUpdateError?: string;
    processingImageIds?: string[];
    popover?: {
        visible: boolean;
        selectedImageId?: string;
        error?: string;
        statusMessage?: string;
    };
    confirmationDialog?: {
        visible: boolean;
        message?: string;
    };
    uploadDialog?: {
        visible: boolean;
    };
    upload?: {
        isUploading: boolean;
        error?: string;
    };
    slideshow?: {
        visible: boolean;
        currentImageId?: string;
        isPaused: boolean;
        imageSequence: string[];
        currentIndex: number;
    };
}

export default class CollectionPageModel extends Model<CollectionPageData> {

    constructor(initialData: Partial<CollectionPageData> = {}) {
        super({
            name: '',
            status: 'COLLECTION',
            images: [],
            error: '',
            loading: false,
            curate: false,
            selectedImageIds: [],
            hiddenImageIds: [],
            statusUpdateError: '',
            processingImageIds: [],
            popover: {
                visible: false,
                selectedImageId: undefined,
                error: undefined,
                statusMessage: undefined
            },
            confirmationDialog: {
                visible: false,
                message: undefined
            },
            uploadDialog: {
                visible: false
            },
            upload: {
                isUploading: false,
                error: undefined
            },
            slideshow: {
                visible: false,
                currentImageId: undefined,
                isPaused: false,
                imageSequence: [],
                currentIndex: 0
            },
            ...initialData
        });
    }

    getCollectionName(): string {
        return this.data.name ?? '';
    }

    getCurrentStatus(): ImageStatus {
        return this.data.status ?? 'COLLECTION';
    }

    getImages(): ImageMetadata[] {
        return this.data.images ?? [];
    }

    private ensurePopover(): NonNullable<CollectionPageData['popover']> {
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

    hasImages(): boolean {
        return (this.data.images || []).length > 0;
    }

    hasError(): boolean {
        return !!this.data.error;
    }

    getErrorMessage(): string {
        return this.data.error || '';
    }

    isLoading(): boolean {
        return this.data.loading || false;
    }

    isPopoverVisible(): boolean {
        return this.data.popover?.visible ?? false;
    }

    getSelectedImageId(): string | undefined {
        return this.data.popover?.selectedImageId;
    }

    getSelectedImage(): ImageMetadata | undefined {
        const selectedId = this.getSelectedImageId();
        if (!selectedId) return undefined;
        return this.getImages().find(img => img.id === selectedId);
    }

    getPopoverError(): string | undefined {
        return this.data.popover?.error;
    }

    getPopoverStatusMessage(): string | undefined {
        return this.data.popover?.statusMessage;
    }

    setPopoverStatusMessage(message: string): void {
        const popover = this.ensurePopover();
        popover.statusMessage = message;
    }

    clearPopoverStatusMessage(): void {
        const popover = this.ensurePopover();
        popover.statusMessage = undefined;
    }

    openPopover(imageId: string): void {
        this.data.popover = {
            visible: true,
            selectedImageId: imageId,
            error: undefined,
            statusMessage: undefined
        };
    }

    closePopover(): void {
        this.data.popover = {
            visible: false,
            selectedImageId: undefined,
            error: undefined,
            statusMessage: undefined
        };
    }

    setPopoverError(message: string): void {
        if (this.data.popover) {
            this.data.popover.error = message;
        }
    }

    advancePopoverToNext(): void {
        if (!this.isPopoverVisible() || !this.data.popover?.selectedImageId) {
            return;
        }

        const images = this.getImages();

        // If no images remain in the filtered view, close the popover
        if (images.length === 0) {
            this.closePopover();
            return;
        }

        const currentImageId = this.data.popover.selectedImageId;
        const currentIndex = images.findIndex(img => img.id === currentImageId);

        // If current image is no longer in the filtered view, show the first available image
        if (currentIndex === -1) {
            const firstImage = images[0];
            if (firstImage) {
                this.data.popover.selectedImageId = firstImage.id;
                this.data.popover.error = undefined; // Clear any previous errors
                this.data.popover.statusMessage = undefined; // Clear any previous status messages
            }
            return;
        }

        // Move to next image, or wrap around to first image
        const nextIndex = (currentIndex + 1) % images.length;
        const nextImage = images[nextIndex];

        if (nextImage) {
            this.data.popover.selectedImageId = nextImage.id;
            this.data.popover.error = undefined; // Clear any previous errors
            this.data.popover.statusMessage = undefined; // Clear any previous status messages
        }
    }

    advancePopoverToPrevious(): void {
        if (!this.isPopoverVisible() || !this.data.popover?.selectedImageId) {
            return;
        }

        const currentImageId = this.data.popover.selectedImageId;
        const images = this.getImages();
        const currentIndex = images.findIndex(img => img.id === currentImageId);

        if (currentIndex === -1) {
            return; // Current image not found
        }

        // Move to previous image, or wrap around to last image
        const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        const prevImage = images[prevIndex];

        if (prevImage) {
            this.data.popover.selectedImageId = prevImage.id;
            this.data.popover.error = undefined; // Clear any previous errors
            this.data.popover.statusMessage = undefined; // Clear any previous status messages
        }
    }

    isCurateMode(): boolean {
        return this.data.curate || false;
    }

    setCurateMode(curate: boolean): void {
        this.data.curate = curate;
    }

    toggleCurateMode(): void {
        this.data.curate = !this.data.curate;
        if (!this.data.curate) {
            this.clearSelection();
        }
    }

    getSelectedImageIds(): string[] {
        return this.data.selectedImageIds || [];
    }

    isImageSelected(imageId: string): boolean {
        return this.getSelectedImageIds().includes(imageId);
    }

    selectImage(imageId: string): void {
        const selectedIds = this.getSelectedImageIds();
        if (!selectedIds.includes(imageId)) {
            this.data.selectedImageIds = [...selectedIds, imageId];
        }
    }

    deselectImage(imageId: string): void {
        const selectedIds = this.getSelectedImageIds();
        this.data.selectedImageIds = selectedIds.filter(id => id !== imageId);
    }

    toggleImageSelection(imageId: string): void {
        if (this.isImageSelected(imageId)) {
            this.deselectImage(imageId);
        } else {
            this.selectImage(imageId);
        }
    }

    selectAllImages(): void {
        const allImageIds = this.getImages().map(image => image.id);
        this.data.selectedImageIds = [...allImageIds];
    }

    clearSelection(): void {
        this.data.selectedImageIds = [];
    }

    hasSelectedImages(): boolean {
        return this.getSelectedImageIds().length > 0;
    }

    // Status update methods
    getStatusUpdateError(): string {
        return this.data.statusUpdateError || '';
    }

    setStatusUpdateError(error: string): void {
        this.data.statusUpdateError = error;
    }

    clearStatusUpdateError(): void {
        this.data.statusUpdateError = '';
    }

    getHiddenImageIds(): string[] {
        return this.data.hiddenImageIds || [];
    }

    isImageHidden(imageId: string): boolean {
        return this.getHiddenImageIds().includes(imageId);
    }

    hideSelectedImages(): void {
        const selectedIds = this.getSelectedImageIds();
        this.data.hiddenImageIds = [...new Set([...this.getHiddenImageIds(), ...selectedIds])];
    }

    unhideImages(imageIds: string[]): void {
        const hiddenIds = this.getHiddenImageIds();
        this.data.hiddenImageIds = hiddenIds.filter(id => !imageIds.includes(id));
    }

    removeImages(imageIds: string[]): void {
        // Remove images from the images array
        this.data.images = (this.data.images || []).filter(img => !imageIds.includes(img.id));
        // Also remove from hidden and selected lists
        this.data.hiddenImageIds = (this.data.hiddenImageIds || []).filter(id => !imageIds.includes(id));
        this.data.selectedImageIds = (this.data.selectedImageIds || []).filter(id => !imageIds.includes(id));
    }

    getProcessingImageIds(): string[] {
        return this.data.processingImageIds || [];
    }

    setProcessingImageIds(imageIds: string[]): void {
        this.data.processingImageIds = imageIds;
    }

    clearProcessingImageIds(): void {
        this.data.processingImageIds = [];
    }

    // Dialog management
    private ensureConfirmationDialog(): NonNullable<CollectionPageData['confirmationDialog']> {
        if (!this.data.confirmationDialog) {
            this.data.confirmationDialog = {
                visible: false,
                message: undefined
            };
        }
        return this.data.confirmationDialog;
    }

    private ensureUploadDialog(): NonNullable<CollectionPageData['uploadDialog']> {
        if (!this.data.uploadDialog) {
            this.data.uploadDialog = {
                visible: false
            };
        }
        return this.data.uploadDialog;
    }

    isConfirmationDialogVisible(): boolean {
        return this.data.confirmationDialog?.visible ?? false;
    }

    getConfirmationDialogMessage(): string {
        return this.data.confirmationDialog?.message ?? '';
    }

    showConfirmationDialog(message: string): void {
        const dialog = this.ensureConfirmationDialog();
        dialog.visible = true;
        dialog.message = message;
    }

    hideConfirmationDialog(): void {
        const dialog = this.ensureConfirmationDialog();
        dialog.visible = false;
        dialog.message = undefined;
    }

    isUploadDialogVisible(): boolean {
        return this.data.uploadDialog?.visible ?? false;
    }

    showUploadDialog(): void {
        const dialog = this.ensureUploadDialog();
        dialog.visible = true;
    }

    hideUploadDialog(): void {
        const dialog = this.ensureUploadDialog();
        dialog.visible = false;
    }

    // Upload state management
    private ensureUpload(): NonNullable<CollectionPageData['upload']> {
        if (!this.data.upload) {
            this.data.upload = {
                isUploading: false,
                error: undefined
            };
        }
        return this.data.upload;
    }

    isUploading(): boolean {
        return this.data.upload?.isUploading ?? false;
    }

    setUploading(isUploading: boolean): void {
        const upload = this.ensureUpload();
        upload.isUploading = isUploading;
    }

    getUploadError(): string | undefined {
        return this.data.upload?.error;
    }

    setUploadError(error: string): void {
        const upload = this.ensureUpload();
        upload.error = error;
    }

    clearUploadError(): void {
        const upload = this.ensureUpload();
        upload.error = undefined;
    }

    // Slideshow methods
    private ensureSlideshow(): NonNullable<CollectionPageData['slideshow']> {
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

    isSlideshowVisible(): boolean {
        return this.data.slideshow?.visible ?? false;
    }

    openSlideshow(): void {
        const images = this.getImages();
        if (images.length === 0) {
            return;
        }

        // Create a shuffled sequence of image IDs
        const imageIds = images.map(img => img.id);
        const shuffledIds = this.shuffleArray([...imageIds]);

        const slideshow = this.ensureSlideshow();
        slideshow.visible = true;
        slideshow.currentImageId = shuffledIds[0];
        slideshow.isPaused = false;
        slideshow.imageSequence = shuffledIds;
        slideshow.currentIndex = 0;
    }

    closeSlideshow(): void {
        const slideshow = this.ensureSlideshow();
        slideshow.visible = false;
        slideshow.currentImageId = undefined;
        slideshow.isPaused = false;
        slideshow.imageSequence = [];
        slideshow.currentIndex = 0;
    }

    getCurrentSlideshowImageId(): string | undefined {
        return this.data.slideshow?.currentImageId;
    }

    isSlideshowPaused(): boolean {
        return this.data.slideshow?.isPaused ?? false;
    }

    pauseSlideshow(): void {
        const slideshow = this.ensureSlideshow();
        slideshow.isPaused = true;
    }

    resumeSlideshow(): void {
        const slideshow = this.ensureSlideshow();
        slideshow.isPaused = false;
    }

    toggleSlideshowPause(): void {
        const slideshow = this.ensureSlideshow();
        slideshow.isPaused = !slideshow.isPaused;
    }

    advanceSlideshow(): void {
        const slideshow = this.ensureSlideshow();
        if (slideshow.imageSequence.length === 0) {
            return;
        }

        const nextIndex = slideshow.currentIndex + 1;

        if (nextIndex >= slideshow.imageSequence.length) {
            // End of sequence - create new shuffled sequence and restart
            const images = this.getImages();
            const imageIds = images.map(img => img.id);
            const shuffledIds = this.shuffleArray([...imageIds]);

            slideshow.imageSequence = shuffledIds;
            slideshow.currentIndex = 0;
            slideshow.currentImageId = shuffledIds[0];
        } else {
            // Advance to next image in sequence
            slideshow.currentIndex = nextIndex;
            slideshow.currentImageId = slideshow.imageSequence[nextIndex];
        }
    }

    skipToNextImage(): void {
        const slideshow = this.ensureSlideshow();
        if (slideshow.imageSequence.length === 0) {
            return;
        }

        // Remove the current failing image from the sequence
        const currentImageId = slideshow.currentImageId;
        slideshow.imageSequence = slideshow.imageSequence.filter(id => id !== currentImageId);

        // If no images left in sequence, create new sequence
        if (slideshow.imageSequence.length === 0) {
            const images = this.getImages();
            const imageIds = images.map(img => img.id).filter(id => id !== currentImageId);
            slideshow.imageSequence = this.shuffleArray([...imageIds]);
            slideshow.currentIndex = 0;
        } else {
            // Adjust index if needed
            if (slideshow.currentIndex >= slideshow.imageSequence.length) {
                slideshow.currentIndex = 0;
            }
        }

        // Set the new current image
        if (slideshow.imageSequence.length > 0) {
            slideshow.currentImageId = slideshow.imageSequence[slideshow.currentIndex];
        }
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = shuffled[i]!;
            shuffled[i] = shuffled[j]!;
            shuffled[j] = temp;
        }
        return shuffled;
    }
}