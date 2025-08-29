export abstract class Model<T> {
    protected data: T;

    constructor(initialData: T) {
        this.data = initialData;
    }

    serialize(): string {
        return JSON.stringify(this.data);
    }
}

export abstract class View<M extends Model<unknown>> {
    constructor(protected model: M, protected slug: string) { }

    private focusState: FocusState = { id: null, start: null, end: null };

    abstract title(): string;

    private captureFocus(): void {
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

    private restoreFocus(): void {
        if (this.focusState.id) {
            requestAnimationFrame(() => {
                const element = document.querySelector<HTMLElement>(`[data-id="${this.focusState.id}"]`);
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

    update(): void {
        this.captureFocus();
        document.getElementById('content')!.innerHTML = this.renderContent();
        this.restoreFocus();
    }

    abstract renderContent(): string;

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
                    <link rel="preload" href="/css/${slug}.css" as="style">
                    <link rel="stylesheet" href="/css/${slug}.css">
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

export abstract class Controller<M extends Model<unknown>, V extends View<M>> {
    constructor(protected model: M, protected view: V) {}
}



