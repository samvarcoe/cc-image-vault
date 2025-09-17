import { Controller } from '../../mvc.js';
import HomePageModel from './model.js';
import HomePageView from './view.js';

export default class HomePageController extends Controller<HomePageModel, HomePageView> {
    constructor(model: HomePageModel, view: HomePageView) {
        super(model, view);
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        // Attach event listeners after view is rendered
        requestAnimationFrame(() => {
            this.attachFormListeners();
            this.attachGlobalListeners();
        });
    }

    private attachGlobalListeners(): void {
        // Use event delegation for more reliable event handling
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target && target.dataset?.id === 'collection-name-input') {
                this.handleInputFocus();
            }
        });
    }

    private attachFormListeners(): void {
        const form = document.querySelector('[data-id="creation-form-element"]') as HTMLFormElement;
        const input = document.querySelector('[data-id="collection-name-input"]') as HTMLInputElement;

        if (form) {
            form.addEventListener('submit', (event) => this.handleFormSubmit(event));
        }

        if (input) {
            input.addEventListener('input', (event) => this.handleInputChange(event));
            input.addEventListener('focus', () => this.handleInputFocus());
            input.addEventListener('click', () => this.handleInputFocus());
        }
    }

    private handleInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.model.setCreationFormName(input.value);

        // Clear validation error when user starts typing
        if (this.model.getCreationFormValidationError()) {
            this.model.clearCreationFormValidationError();
            this.view.update();
            this.attachFormListeners();
        }
    }

    private handleInputFocus(): void {
        // Clear validation error when user focuses on input
        if (this.model.getCreationFormValidationError()) {
            this.model.clearCreationFormValidationError();
            this.view.update();
            this.attachFormListeners();
        }
    }

    private async handleFormSubmit(event: Event): Promise<void> {
        event.preventDefault();

        const name = this.model.getCreationFormName();

        // Perform client-side validation
        const validationError = this.model.validateCollectionName(name);
        if (validationError) {
            this.model.setCreationFormValidationError(validationError);
            this.view.update();
            return;
        }

        try {
            // Set loading state and update view
            this.model.setCreationFormLoading(true);
            this.view.update();

            // Re-attach event listeners after view update
            this.attachFormListeners();

            // Create the collection
            await this.model.createCollection(name);

            // Update view to show new collection
            this.view.update();

            // Re-attach event listeners after view update
            this.attachFormListeners();
        } catch {
            // Error is already handled in the model
            this.view.update();
            this.attachFormListeners();
        }
    }
}