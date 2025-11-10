import { Controller } from '../../mvc.js';
export default class HomePageController extends Controller {
    constructor(model, view) {
        super(model, view);
        this.attachEventListeners();
    }
    attachEventListeners() {
        requestAnimationFrame(() => {
            this.attachFormListeners();
            this.attachGlobalListeners();
        });
    }
    attachGlobalListeners() {
        document.addEventListener('click', (event) => {
            var _a;
            const target = event.target;
            if (target && ((_a = target.dataset) === null || _a === void 0 ? void 0 : _a.id) === 'collection-name-input') {
                this.handleInputFocus();
            }
        });
    }
    attachFormListeners() {
        const form = document.querySelector('[data-id="creation-form-element"]');
        const input = document.querySelector('[data-id="collection-name-input"]');
        if (form) {
            form.addEventListener('submit', (event) => this.handleFormSubmit(event));
        }
        if (input) {
            input.addEventListener('input', (event) => this.handleInputChange(event));
            input.addEventListener('focus', () => this.handleInputFocus());
            input.addEventListener('click', () => this.handleInputFocus());
        }
    }
    handleInputChange(event) {
        const input = event.target;
        this.model.setCreationFormName(input.value);
        if (this.model.getCreationFormValidationError()) {
            this.model.clearCreationFormValidationError();
            this.view.update();
            this.attachFormListeners();
        }
    }
    handleInputFocus() {
        if (this.model.getCreationFormValidationError()) {
            this.model.clearCreationFormValidationError();
            this.view.update();
            this.attachFormListeners();
        }
    }
    async handleFormSubmit(event) {
        event.preventDefault();
        const name = this.model.getCreationFormName();
        const validationError = this.model.validateCollectionName(name);
        if (validationError) {
            this.model.setCreationFormValidationError(validationError);
            this.view.update();
            return;
        }
        try {
            this.model.setCreationFormLoading(true);
            this.view.update();
            this.attachFormListeners();
            await this.model.createCollection(name);
            this.view.update();
            this.attachFormListeners();
        }
        catch (_a) {
            this.view.update();
            this.attachFormListeners();
        }
    }
}
