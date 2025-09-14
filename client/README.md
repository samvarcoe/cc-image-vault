# Client Module

## Web Interface for Image Vault
Frontend client implementation providing collection management interfaces using MVC architecture with TypeScript and HTML template literals.

## Exports
```typescript
export { routes } from './src/routes';
```

### Architecture
- **MVC Framework**: Custom TypeScript implementation with Model/View/Controller separation
- **Server-Side Rendering**: Express routes generate complete HTML pages
- **Client-Side Hydration**: JavaScript bootstraps MVC components for interactivity
- **Type Safety**: Full TypeScript implementation with global type declarations

### MVC Implementation
```text
client/src/
├── mvc.ts                 # Base Model, View, Controller classes
├── routes.ts              # Express router definitions
├── pages/home/            # Home page MVC components
│   ├── model.ts          # Data management and state
│   ├── view.ts           # HTML rendering and templating
│   └── controller.ts     # Event handling and user interactions
└── styles/input.css      # Tailwind CSS input
```

### Page Structure
- **Models**: Manage page state and data serialization for client hydration
- **Views**: Generate HTML using template literals with full page rendering
- **Controllers**: Handle user interactions and coordinate model/view updates
- **Focus Management**: Automatic focus preservation across page updates

## Implementation Status
- ✅ **Home Page**: Complete MVC implementation for viewing collections
- ✅ **Collection Display**: Card-based layout with navigation links
- ✅ **Error Handling**: User-friendly messages for loading errors and empty states
- ⏳ **Collection Management**: Create, edit, delete operations pending implementation
- ⏳ **Image Operations**: Image viewing, upload, management interfaces pending implementation

### Home Page Details
The home page (`/`) provides:
- Collection listing in card-based layout with collection names
- Navigation links to individual collection pages (`/collection/:id`)
- Empty state message: "No Collections found, create one to get started"
- Error state message: "Unable to load collections"
- All acceptance tests passing (3 scenarios)

## Styling with Tailwind CSS

### Configuration
- **Version**: Tailwind CSS v4 (latest)
- **CLI**: `@tailwindcss/cli` for compilation
- **Input**: `client/src/styles/input.css` (`@import "tailwindcss";`)
- **Output**: `public/style.css` (served to browser)

### Usage in Components
Tailwind utility classes are used directly in TypeScript template literals:

```typescript
renderContent() {
    return /*html*/`
        <div class="min-h-screen bg-gray-50">
            <div class="max-w-4xl mx-auto py-16 px-4">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">Title</h1>
            </div>
        </div>
    `;
}
```

### Build Commands
- `npm run css:build` - Compile CSS once
- `npm run css:watch` - Watch and rebuild CSS during development
- `npm run dev` - Starts CSS watch alongside TypeScript compilation

## Error Handling
- **User-Friendly Messages**: Consistent error display for API failures
- **Empty States**: Helpful guidance when no data is available
- **Client-Side Errors**: Console logging with graceful degradation
- **Focus Management**: Preserved across updates and error states

## Testing
### Test Setup
- Test isolation achieved through UI model abstractions and page objects
- Playwright integration tests execute against live rendered pages
- UI models provide assertable wrappers for page interactions
- Hooks implemented in `client/tests/acceptance/setup.ts`

### UI Model Architecture
```text
client/tests/ui-model/
├── base/
│   ├── element.ts        # Base element interactions
│   ├── page.ts          # Base page model
│   └── ui.ts            # UI abstraction layer
├── pages/home.ts        # Home page model
└── image-vault.ts       # Application-level model
```

### Reference Components
Pre-built UI components are available in `/workspace/projects/ui-reference/` for reference and inspiration. These demonstrate common patterns using Tailwind classes that can be adapted for the Image Vault implementation.