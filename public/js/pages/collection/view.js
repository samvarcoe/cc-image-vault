import { View } from '../../mvc.js';
export default class CollectionPageView extends View {
    constructor(model) {
        super(model, 'collection');
        this.model = model;
    }
    title() {
        const collectionName = this.model.getCollectionName();
        return `Image Vault - ${collectionName}`;
    }
    renderContent() {
        return `
            ${this.slideshow()}
            ${this.popover()}
            ${this.confirmationDialog()}
            ${this.uploadDialog()}
            <div class="min-h-full">
                ${this.header()}
                ${this.curationMenu()}
                ${this.main()}
            </div>

        `;
    }
    header() {
        const collectionName = this.model.getCollectionName();
        const currentStatus = this.model.getCurrentStatus();
        return `
            <header data-id="header-menu" class="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-14 items-center">
                        <div class="flex-1">
                            <a href="/" data-id="image-vault-link" class="text-xl font-semibold text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300">
                                Image Vault
                            </a>
                        </div>
                        <div data-id="status-toggle" class="flex gap-2">
                            ${this.statusButton('INBOX', collectionName, currentStatus)}
                            ${this.statusButton('COLLECTION', collectionName, currentStatus)}
                            ${this.statusButton('ARCHIVE', collectionName, currentStatus)}
                        </div>
                        <div class="flex-1 flex justify-end gap-2">
                            ${this.slideshowButton()}
                            ${this.uploadButton()}
                            ${this.curateButton()}
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
    statusButton(status, collectionName, currentStatus) {
        const isSelected = status === currentStatus;
        const baseClasses = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors';
        const stateClasses = isSelected
            ? 'bg-slate-700 text-white dark:bg-slate-600'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';
        const curateParam = this.model.isCurateMode() ? 'true' : 'false';
        return `
            <a
                href="/collection/${collectionName}?status=${status}&curate=${curateParam}"
                data-id="status-button-${status}"
                aria-pressed="${isSelected}"
                class="${baseClasses} ${stateClasses}"
            >
                ${status}
            </a>
        `;
    }
    uploadButton() {
        const isUploading = this.model.isUploading();
        const baseClasses = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer';
        const stateClasses = 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';
        const disabledClasses = isUploading ? 'opacity-50 cursor-not-allowed' : '';
        return `
            <button
                data-id="upload-button"
                data-loading="${isUploading}"
                class="${baseClasses} ${stateClasses} ${disabledClasses}"
                ${isUploading ? 'disabled' : ''}
            >
                ${isUploading ? '⏳' : 'Upload'}
            </button>
        `;
    }
    slideshowButton() {
        const hasImages = this.model.hasImages();
        const baseClasses = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer';
        const stateClasses = hasImages
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500';
        return `
            <button
                data-id="slideshow-button"
                class="${baseClasses} ${stateClasses}"
                ${!hasImages ? 'disabled' : ''}
            >
                Slideshow
            </button>
        `;
    }
    curateButton() {
        const isSelected = this.model.isCurateMode();
        const baseClasses = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer';
        const stateClasses = isSelected
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';
        return `
            <button
                data-id="curate-button"
                aria-pressed="${isSelected}"
                class="${baseClasses} ${stateClasses}"
            >
                Curate
            </button>
        `;
    }
    curationMenu() {
        if (!this.model.isCurateMode()) {
            return '';
        }
        const currentStatus = this.model.getCurrentStatus();
        const hasSelectedImages = this.model.hasSelectedImages();
        const statusUpdateError = this.model.getStatusUpdateError();
        return `
            <div data-id="curation-menu" class="sticky top-14 z-30 bg-white shadow-sm border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-14 items-center justify-between">
                        <div class="flex gap-2">
                            <button
                                data-id="select-all-button"
                                class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                            >
                                Select All
                            </button>
                            <button
                                data-id="clear-button"
                                class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                            >
                                Clear
                            </button>
                        </div>
                        ${statusUpdateError ? `
                            <div data-id="curation-error-message" class="text-red-600 text-sm">
                                ${statusUpdateError}
                            </div>
                        ` : ''}
                        <div class="flex gap-2">
                            ${this.statusUpdateButtons(currentStatus, hasSelectedImages)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    statusUpdateButtons(status, hasSelectedImages) {
        const disabledClass = hasSelectedImages ? '' : 'opacity-50 cursor-not-allowed';
        const baseClasses = `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${disabledClass}`;
        const enabledClasses = hasSelectedImages
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-100 text-slate-700';
        switch (status) {
            case 'INBOX':
                return `
                    <button
                        data-id="keep-button"
                        class="${baseClasses} ${enabledClasses}"
                        ${!hasSelectedImages ? 'disabled' : ''}
                    >
                        Keep
                    </button>
                    <button
                        data-id="discard-button"
                        class="${baseClasses} ${enabledClasses}"
                        ${!hasSelectedImages ? 'disabled' : ''}
                    >
                        Discard
                    </button>
                `;
            case 'COLLECTION':
                return `
                    <button
                        data-id="discard-button"
                        class="${baseClasses} ${enabledClasses}"
                        ${!hasSelectedImages ? 'disabled' : ''}
                    >
                        Discard
                    </button>
                `;
            case 'ARCHIVE':
                return `
                    <button
                        data-id="restore-button"
                        class="${baseClasses} ${enabledClasses}"
                        ${!hasSelectedImages ? 'disabled' : ''}
                    >
                        Restore
                    </button>
                    <button
                        data-id="delete-button"
                        class="${baseClasses} ${enabledClasses}"
                        ${!hasSelectedImages ? 'disabled' : ''}
                    >
                        Delete
                    </button>
                `;
            default:
                return '';
        }
    }
    main() {
        return `
            <main class="bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div class="container mx-auto px-4 py-8">
                    ${this.pageHeader()}
                    ${this.content()}
                </div>
            </main>
        `;
    }
    pageHeader() {
        const collectionName = this.model.getCollectionName();
        const uploadError = this.model.getUploadError();
        return `
            <div class="text-center mb-8">
                <h1 class="text-3xl font-semibold text-slate-900 dark:text-white mb-2">${collectionName}</h1>
                ${uploadError ? `
                    <div data-id="error-message" class="text-red-600 text-sm mt-2">
                        ${uploadError}
                    </div>
                ` : ''}
            </div>
        `;
    }
    content() {
        if (this.model.hasError()) {
            return this.errorState();
        }
        if (!this.model.hasImages()) {
            return this.emptyState();
        }
        return this.imageGrid();
    }
    errorState() {
        return `
            <div class="text-center py-12">
                <p class="text-lg text-slate-600 dark:text-slate-400" data-id="error-message">${this.model.getErrorMessage()}</p>
            </div>
        `;
    }
    emptyState() {
        const currentStatus = this.model.getCurrentStatus();
        return `
            <div class="text-center py-12">
                <p class="text-lg text-slate-600 dark:text-slate-400" data-id="empty-message">This Collection has no images with "${currentStatus}" status</p>
            </div>
        `;
    }
    imageGrid() {
        const images = this.model.getImages();
        const collectionName = this.model.getCollectionName();
        const imageCards = images.map(image => this.imageCard(image, collectionName)).join('');
        return `
            <div class="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4" data-id="image-grid">
                ${imageCards}
            </div>
        `;
    }
    imageCard(image, collectionName) {
        const thumbnailUrl = `/api/images/${collectionName}/${image.id}/thumbnail`;
        const imageWidth = 400;
        const imageHeight = Math.round(imageWidth / image.aspect);
        const isSelected = this.model.isImageSelected(image.id);
        const isHidden = this.model.isImageHidden(image.id);
        const selectedAttribute = isSelected ? 'data-selected="true"' : '';
        const hiddenAttribute = isHidden ? 'data-hidden="true"' : '';
        const selectionClasses = isSelected ? 'border-5 border-blue-200' : '';
        const imageClasses = isHidden ? 'invisible' : '';
        const imageSrc = isHidden ? '' : thumbnailUrl;
        return `
            <div class="bg-white rounded-lg overflow-hidden shadow-sm mb-4 break-inside-avoid cursor-pointer hover:shadow-md transition-shadow ${selectionClasses}" data-id="image-card-${image.id}" data-image-id="${image.id}" ${selectedAttribute} ${hiddenAttribute}>
                <img
                    src="${imageSrc}"
                    alt="Image ${image.id}"
                    loading="lazy"
                    width="${imageWidth}"
                    height="${imageHeight}"
                    class="w-full h-auto block ${imageClasses}"
                />
            </div>
        `;
    }
    popover() {
        if (!this.model.isPopoverVisible()) {
            return '';
        }
        const selectedImage = this.model.getSelectedImage();
        const popoverError = this.model.getPopoverError();
        const collectionName = this.model.getCollectionName();
        if (!selectedImage) {
            return '';
        }
        const originalImageUrl = `/api/images/${collectionName}/${selectedImage.id}`;
        return `
            <div data-id="fullscreen-popover" class="fixed w-full h-full z-50 flex items-center justify-center bg-black/70  backdrop-blur-lg">
                ${popoverError ?
            `
                        <div class="text-white text-lg font-medium text-center" data-id="popover-error-message">
                            ${popoverError}
                        </div>
                    ` :
            `
                        <div class="w-full h-full flex items-center justify-center p-4">
                            <img
                                src="${originalImageUrl}"
                                alt="Full size image ${selectedImage.id}"
                                class="max-w-full max-h-full object-contain"
                                width="${selectedImage.width}"
                                height="${selectedImage.height}"
                                data-id="popover-image"
                            />
                        </div>
                    `}
            </div>
        `;
    }
    confirmationDialog() {
        if (!this.model.isConfirmationDialogVisible()) {
            return '';
        }
        const message = this.model.getConfirmationDialogMessage();
        return `
            <div data-id="confirmation-dialog" class="fixed w-full h-full z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
                <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                    <div class="text-slate-900 dark:text-white text-lg font-medium mb-4" data-id="confirmation-message">
                        ${message}
                    </div>
                    <div class="flex justify-end gap-3">
                        <button
                            data-id="cancel-button"
                            class="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            data-id="confirm-delete-button"
                            class="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    slideshow() {
        if (!this.model.isSlideshowVisible()) {
            return '';
        }
        const currentImageId = this.model.getCurrentSlideshowImageId();
        const collectionName = this.model.getCollectionName();
        const isPaused = this.model.isSlideshowPaused();
        if (!currentImageId) {
            return '';
        }
        const imageUrl = `/api/images/${collectionName}/${currentImageId}`;
        return `
            <div data-id="slideshow" class="fixed inset-0 z-[60] bg-black flex items-center justify-center">
                <img
                    src="${imageUrl}"
                    alt="Slideshow image ${currentImageId}"
                    class="max-w-full max-h-full object-contain"
                    data-id="slideshow-image"
                />
                ${isPaused ? `
                    <div data-id="pause-symbol" class="fixed bottom-4 right-4 text-white text-2xl">
                        ⏸
                    </div>
                ` : ''}
            </div>
        `;
    }
    uploadDialog() {
        if (!this.model.isUploadDialogVisible()) {
            return '';
        }
        return `
            <div data-id="upload-dialog" class="fixed w-full h-full z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
                <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                    <div class="text-slate-900 dark:text-white text-lg font-medium mb-4">
                        Upload Images
                    </div>
                    <div class="mb-4">
                        <input
                            type="file"
                            data-id="file-input"
                            accept="image/*"
                            multiple=""
                            class="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                dark:file:bg-slate-700 dark:file:text-slate-300
                                dark:hover:file:bg-slate-600"
                        />
                    </div>
                    <div class="flex justify-end gap-3">
                        <button
                            data-id="cancel-button"
                            class="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            data-id="add-button"
                            class="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}
