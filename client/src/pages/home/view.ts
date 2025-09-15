import { View } from '../../mvc.js';
import HomePageModel from './model.js';

export default class HomePageView extends View<HomePageModel> {
    constructor(protected model: HomePageModel) {
        super(model, 'home');
    }

    title(): string {
        return 'Image Vault - Home';
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
                <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 sm:px-6 lg:px-8">
                    <div class="w-full max-w-2xl lg:max-w-4xl">
                        ${this.pageHeader()}
                        ${this.mainContentContainer()}
                    </div>
                </div>
            </main>
        `;
    }

    private pageHeader(): string {
        return /*html*/`
            <div class="text-center mb-12">
                <h2 class="text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white mb-4">Collections</h2>
                <p class="text-base lg:text-lg text-slate-600 dark:text-slate-400">Your image collections</p>
            </div>
        `;
    }

    private mainContentContainer(): string {
        return /*html*/`
            <div class="bg-white shadow-lg ring-1 ring-slate-200 rounded-xl dark:bg-slate-800 dark:ring-slate-700">
                ${this.containerContent()}
            </div>
        `;
    }

    private containerContent(): string {
        if (this.model.hasError()) {
            return this.errorMessage();
        }

        if (this.model.getCollections().length === 0) {
            return this.emptyMessage();
        }

        return this.collectionsList();
    }

    private errorMessage(): string {
        return /*html*/`
            <div class="px-8 py-20 text-center">
                <p class="text-base lg:text-lg text-slate-600 dark:text-slate-400" data-id="user-message">${this.model.getErrorMessage()}</p>
            </div>
        `;
    }

    private emptyMessage(): string {
        return /*html*/`
            <div class="px-8 py-20 text-center">
                <p class="text-base lg:text-lg text-slate-600 dark:text-slate-400" data-id="user-message">No Collections found, create one to get started</p>
            </div>
        `;
    }

    private collectionsList(): string {
        const collectionsHtml = this.model.getCollections()
            .map((name) => this.collectionCard(name))
            .join('');

        return /*html*/`
            <ul role="list" class="divide-y divide-slate-200 dark:divide-slate-700">
                ${collectionsHtml}
            </ul>
        `;
    }

    private collectionCard(name: string): string {
        return /*html*/`
            <li class="relative px-8 py-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150" data-id="collection-card-${name}">
                <div class="min-w-0">
                    <p class="text-base lg:text-lg font-medium text-slate-900 dark:text-white">
                        <a href="/collection/${name}" class="block" data-id="collection-link">
                            <span class="absolute inset-0"></span>
                            <span data-id="collection-title">${name}</span>
                        </a>
                    </p>
                </div>
            </li>
        `;
    }
}