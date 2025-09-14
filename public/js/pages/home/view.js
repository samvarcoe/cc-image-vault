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
        <div class="min-h-screen bg-gray-50">
            <div class="max-w-4xl mx-auto py-16 px-4">
                <header class="text-center">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">Image Vault</h1>
                    <p class="text-lg text-gray-600 mb-8">Organize and manage your image collections</p>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors">
                            Get Started
                        </button>
                </header>
            </div>
        </div>
    `;
    }
}
