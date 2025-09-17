import { View } from '../../mvc.js';
export default class HomePageView extends View {
    constructor(model) {
        super(model, 'home');
        this.model = model;
    }
    title() {
        return 'Image Vault - Home';
    }
    renderContent() {
        return `
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
                <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 sm:px-6 lg:px-8">
                    <div class="w-full max-w-2xl lg:max-w-4xl">
                        ${this.pageHeader()}
                        ${this.mainContentContainer()}
                    </div>
                </div>
            </main>
        `;
    }
    pageHeader() {
        return `
            <div class="text-center mb-12">
                <h2 class="text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white mb-4">Collections</h2>
                <p class="text-base lg:text-lg text-slate-600 dark:text-slate-400">Your image collections</p>
            </div>
        `;
    }
    mainContentContainer() {
        return `
            <div class="bg-white shadow-lg ring-1 ring-slate-200 rounded-xl dark:bg-slate-800 dark:ring-slate-700">
                ${this.containerContent()}
            </div>
        `;
    }
    containerContent() {
        if (this.model.hasError()) {
            return this.errorMessage();
        }
        return this.collectionsList();
    }
    errorMessage() {
        return `
            <div class="px-8 py-20 text-center">
                <p class="text-base lg:text-lg text-slate-600 dark:text-slate-400" data-id="user-message">${this.model.getErrorMessage()}</p>
            </div>
        `;
    }
    emptyMessage() {
        return `
            <p class="px-8 py-12 text-center text-base lg:text-lg text-slate-600 dark:text-slate-400" data-id="empty-collections-message">No Collections found, create one to get started</p>
        `;
    }
    collectionsList() {
        const collectionsHtml = this.model.getCollections()
            .map((name) => this.collectionCard(name))
            .join('');
        const userMessage = this.userMessage();
        return `
            <ul role="list" class="divide-y divide-slate-200 dark:divide-slate-700" data-id="collections-list">
                ${this.model.getCollections().length === 0 ? this.emptyMessage() : collectionsHtml}
                ${this.creationForm()}
            </ul>
            ${userMessage}
        `;
    }
    collectionCard(name) {
        return `
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
    creationForm() {
        const isLoading = this.model.isCreationFormLoading();
        const name = this.model.getCreationFormName();
        return `
            <li class="relative px-8 py-6" data-id="creation-form">
                <form class="flex gap-4 items-center" data-id="creation-form-element">
                    <input
                        type="text"
                        name="name"
                        data-id="collection-name-input"
                        placeholder="Add a new Collection..."
                        value="${name}"
                        class="flex-1 px-4 py-2 text-base lg:text-lg border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        ${isLoading ? 'disabled' : ''}
                    />
                    <button
                        type="submit"
                        data-id="submit-button"
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center"
                        ${isLoading ? 'disabled' : ''}
                    >
                        ${isLoading ? `
                            <svg data-id="loading-spinner" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ` : 'Create'}
                    </button>
                </form>
            </li>
        `;
    }
    userMessage() {
        const validationError = this.model.getCreationFormValidationError();
        if (!validationError) {
            return `
                <div style="display: none;">
                    <p data-id="user-message"></p>
                </div>
            `;
        }
        return `
            <div class="px-8 py-4 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800">
                <p class="text-base text-red-600 dark:text-red-400" data-id="user-message">${validationError}</p>
            </div>
        `;
    }
}
