export class Model {
    constructor(initialData) {
        this.data = initialData;
    }
    serialize() {
        return JSON.stringify(this.data);
    }
}
export class View {
    constructor(model, slug) {
        this.model = model;
        this.slug = slug;
        this.focusState = { id: null, start: null, end: null };
    }
    captureFocus() {
        this.focusState = { id: null, start: null, end: null };
        const element = document.activeElement;
        if (element instanceof HTMLElement && element.dataset.id) {
            this.focusState.id = element.dataset.id;
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                this.focusState.start = element.selectionStart;
                this.focusState.end = element.selectionEnd;
            }
        }
    }
    restoreFocus() {
        if (this.focusState.id) {
            requestAnimationFrame(() => {
                const element = document.querySelector(`[data-id="${this.focusState.id}"]`);
                if (element) {
                    element.focus();
                    if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
                        this.focusState.start !== null && this.focusState.end !== null) {
                        element.setSelectionRange(this.focusState.start, this.focusState.end);
                    }
                }
            });
        }
    }
    update() {
        this.captureFocus();
        document.getElementById('content').innerHTML = this.renderContent();
        this.restoreFocus();
    }
    render() {
        return `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title> ${this.title()}</title>
                    <link rel="preload" href="/css/${this.slug}.css" as="style">
                    <link rel="stylesheet" href="/css/${this.slug}.css">
                </head>
                <body>
                    <div id="content"> ${this.renderContent()} </div>

                    <script>
                        document.addEventListener('DOMContentLoaded', async () => {
                            try {
                                const [modelModule, viewModule, controllerModule] = await Promise.all([
                                    import('/js/pages/${this.slug}/model.js'),
                                    import('/js/pages/${this.slug}/view.js'), 
                                    import('/js/pages/${this.slug}/controller.js')
                                ]);
                                
                                const Model = modelModule.default;
                                const View = viewModule.default;
                                const Controller = controllerModule.default;
                                
                                const initialData = JSON.parse('${this.model.serialize()}');
                                const model = new Model(initialData);
                                const view = new View(model, '${this.slug}');
                                const controller = new Controller(model, view);
                                
                            } catch (error) {
                                console.error('Failed to bootstrap page:', error);
                            }
                        });
                    </script>
                </body>
            </html>
        `;
    }
}
export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
}
