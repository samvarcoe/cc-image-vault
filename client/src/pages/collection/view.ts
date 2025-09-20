import { View } from '../../mvc.js';
import CollectionPageModel from './model.js';

export default class CollectionPageView extends View<CollectionPageModel> {
    constructor(protected model: CollectionPageModel) {
        super(model, 'collection');
    }

    title(): string {
        const collectionName = this.model.getCollectionName();
        return `Image Vault - ${collectionName}`;
    }

    renderContent(): string {
        return /*html*/`
            ${this.popover()}
            <div class="min-h-full">
                ${this.header()}
                ${this.curationMenu()}
                ${this.main()}
            </div>

        `;
    }

    private header(): string {
        const collectionName = this.model.getCollectionName();
        const currentStatus = this.model.getCurrentStatus();

        return /*html*/`
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

    private statusButton(status: ImageStatus, collectionName: string, currentStatus: ImageStatus): string {
        const isSelected = status === currentStatus;
        const baseClasses = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors';
        const stateClasses = isSelected
            ? 'bg-slate-700 text-white dark:bg-slate-600'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';

        const curateParam = this.model.isCurateMode() ? 'true' : 'false';

        return /*html*/`
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

    private curateButton(): string {
        const isSelected = this.model.isCurateMode();
        const baseClasses = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer';
        const stateClasses = isSelected
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';

        return /*html*/`
            <button
                data-id="curate-button"
                aria-pressed="${isSelected}"
                class="${baseClasses} ${stateClasses}"
            >
                Curate
            </button>
        `;
    }

    private curationMenu(): string {
        if (!this.model.isCurateMode()) {
            return '';
        }

        return /*html*/`
            <div data-id="curation-menu" class="sticky top-14 z-30 bg-white shadow-sm border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-14 items-center">
                        <!-- Curation menu content will be added here in future iterations -->
                    </div>
                </div>
            </div>
        `;
    }

    private main(): string {
        return /*html*/`
            <main class="bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div class="container mx-auto px-4 py-8">
                    ${this.pageHeader()}
                    ${this.content()}
                </div>
            </main>
        `;
    }

    private pageHeader(): string {
        const collectionName = this.model.getCollectionName();
        return /*html*/`
            <div class="text-center mb-8">
                <h1 class="text-3xl font-semibold text-slate-900 dark:text-white mb-2">${collectionName}</h1>
            </div>
        `;
    }

    private content(): string {
        if (this.model.hasError()) {
            return this.errorState();
        }

        if (!this.model.hasImages()) {
            return this.emptyState();
        }

        return this.imageGrid();
    }

    private errorState(): string {
        return /*html*/`
            <div class="text-center py-12">
                <p class="text-lg text-slate-600 dark:text-slate-400" data-id="error-message">${this.model.getErrorMessage()}</p>
            </div>
        `;
    }

    private emptyState(): string {
        const currentStatus = this.model.getCurrentStatus();
        return /*html*/`
            <div class="text-center py-12">
                <p class="text-lg text-slate-600 dark:text-slate-400" data-id="empty-message">This Collection has no images with "${currentStatus}" status</p>
            </div>
        `;
    }

    private imageGrid(): string {
        const images = this.model.getImages();
        const collectionName = this.model.getCollectionName();

        const imageCards = images.map(image => this.imageCard(image, collectionName)).join('');

        return /*html*/`
            <div class="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4" data-id="image-grid">
                ${imageCards}
            </div>
        `;
    }

    private imageCard(image: ImageMetadata, collectionName: string): string {
        const thumbnailUrl = `/api/images/${collectionName}/${image.id}/thumbnail`;
        const imageWidth = 400;
        const imageHeight = Math.round(imageWidth / image.aspect);

        return /*html*/`
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

    private popover(): string {
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

        return /*html*/`
            <div data-id="fullscreen-popover" class="fixed w-full h-full z-50 flex items-center justify-center bg-black/70  backdrop-blur-lg">
                ${popoverError ?
                    /*html*/`
                        <div class="text-white text-lg font-medium text-center" data-id="popover-error-message">
                            ${popoverError}
                        </div>
                    ` :
                    /*html*/`
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
                    `
                }
            </div>
        `;
    }
}