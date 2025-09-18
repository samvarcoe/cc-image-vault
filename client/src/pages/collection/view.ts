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
            <div class="min-h-full">
                ${this.header()}
                ${this.main()}
            </div>
        `;
    }

    private header(): string {
        return /*html*/`
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
                <h2 class="text-3xl font-semibold text-slate-900 dark:text-white mb-2">${collectionName}</h2>
                <p class="text-slate-600 dark:text-slate-400">Collection Images</p>
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
        return /*html*/`
            <div class="text-center py-12">
                <p class="text-lg text-slate-600 dark:text-slate-400" data-id="empty-message">This collection has no images with "COLLECTION" status</p>
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
            <div class="bg-white rounded-lg overflow-hidden shadow-sm mb-4 break-inside-avoid" data-id="image-card-${image.id}">
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

    render(): string {
        const slug = this.slug;
        const title = this.title();
        const content = this.renderContent();
        const modelData = this.model.serialize();

        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title> ${title} </title>
                    <link rel="preload" href="/style.css" as="style">
                    <link rel="stylesheet" href="/style.css">
                </head>
                <body>
                    <div id="content"> ${content} </div>

                    <script type='module' src='/js/mvc.js'></script>
                    <script type='module' src='/js/pages/${slug}/model.js'></script>
                    <script type='module' src='/js/pages/${slug}/view.js'></script>
                    <script type='module' src='/js/pages/${slug}/controller.js'></script>

                    <script type="module">
                        import Model from '/js/pages/${slug}/model.js';
                        import View from '/js/pages/${slug}/view.js';
                        import Controller from '/js/pages/${slug}/controller.js';

                        try {
                            const initialData = JSON.parse('${modelData}');
                            const model = new Model(initialData);
                            const view = new View(model, '${slug}');
                            const controller = new Controller(model, view);

                        } catch (error) {
                            console.error('Failed to bootstrap page:', error);
                        }
                    </script>
                </body>
            </html>
        `;
    }
}