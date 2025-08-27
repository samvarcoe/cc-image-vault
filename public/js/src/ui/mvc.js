export function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
export function escapeJsonForScript(obj) {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/'/g, '\\u0027')
        .replace(/"/g, '\\u0022');
}
export class Model {
    constructor(initialData) {
        this.data = initialData || {};
    }
    serialize() {
        return JSON.stringify(this.data);
    }
    hydrate(data) {
        this.data = JSON.parse(data);
    }
}
export class View {
    constructor(model) {
        this.model = model;
    }
}
export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
    attachEventListeners() { }
    init() {
        this.model.hydrate(window.__MODEL_DATA__);
        this.attachEventListeners();
    }
    updateView() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = this.view.render();
        }
    }
}
export function renderPage(view, model, pageSlug) {
    const modelDataString = model.serialize();
    const escapedModelData = modelDataString
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(view.getTitle())}</title>
        <link rel="stylesheet" href="/css/${pageSlug}.css">
      </head>
      <body>
        <div id="app">${view.render()}</div>
        
        <script>
          window.__MODEL_DATA__ = '${escapedModelData}';
        </script>
        <script type="module" src="/js/pages/${pageSlug}/model.js"></script>
        <script type="module" src="/js/pages/${pageSlug}/view.js"></script>
        <script type="module" src="/js/pages/${pageSlug}/controller.js"></script>
      </body>
    </html>
  `;
}
