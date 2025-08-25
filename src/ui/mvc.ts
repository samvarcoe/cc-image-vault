export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function escapeJsonForScript(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
    .replace(/"/g, '\\u0022');
}

export abstract class Model<T> {
  protected data: T;
  
  constructor(initialData?: T) {
    this.data = initialData || {} as T;
  }
  
  serialize(): string {
    return JSON.stringify(this.data);
  }
  
  hydrate(data: string): void {
    this.data = JSON.parse(data);
  }
}

export abstract class View<T> {
  constructor(protected model: Model<T>) {}

  abstract getTitle(): string;
  abstract render(): string;
}

export abstract class Controller<T> {
  constructor(
    protected model: Model<T>,
    protected view: View<T>
  ) {}
  
  protected attachEventListeners(): void {}
  
  init(): void {
    this.model.hydrate((window as unknown as { __MODEL_DATA__: string }).__MODEL_DATA__);
    this.attachEventListeners();
  }
  
  protected updateView(): void {
    const app = document.getElementById('app');

    if (app) {
      app.innerHTML = this.view.render();
    }
  }
}

export function renderPage<T>(view: View<T>, model: Model<T>, pageSlug: string): string {
  const modelDataString = model.serialize();
  // Escape the JSON string for safe inclusion in HTML
  const escapedModelData = modelDataString
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  
  return /*html*/`
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