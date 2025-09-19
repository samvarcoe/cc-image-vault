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
                ${this.main()}
            </div>

        `;
    }
    header() {
        return `
            <header class="bg-white shadow-sm border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-16 items-center justify-between">
                        <div class="flex items-center">
                            <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Image Vault</h1>
                        </div>
                    </div>
                </div>
            </header>
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
        return `
            <div class="text-center py-12">
                <p class="text-lg text-slate-600 dark:text-slate-400" data-id="empty-message">This collection has no images with "COLLECTION" status</p>
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
            <div data-id="fullscreen-popover" class="fixed w-full h-full z-50 flex items-center justify-center bg-black/80  backdrop-blur-lg">
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
