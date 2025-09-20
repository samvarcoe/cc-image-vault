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
            ${this.popover()}
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
                        <div class="flex-1 flex justify-end">
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
        return `
            <div data-id="curation-menu" class="sticky top-14 z-30 bg-white shadow-sm border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-14 items-center">
                        <!-- Curation menu content will be added here in future iterations -->
                    </div>
                </div>
            </div>
        `;
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
        return `
            <div class="text-center mb-8">
                <h1 class="text-3xl font-semibold text-slate-900 dark:text-white mb-2">${collectionName}</h1>
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
        return `
            <div class="bg-white rounded-lg overflow-hidden shadow-sm mb-4 break-inside-avoid cursor-pointer hover:shadow-md transition-shadow" data-id="image-card-${image.id}" data-image-id="${image.id}">
                <img
                    src="${thumbnailUrl}"
                    alt="Image ${image.id}"
                    loading="lazy"
                    width="${imageWidth}"
                    height="${imageHeight}"
                    class="w-full h-auto block"
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
}
