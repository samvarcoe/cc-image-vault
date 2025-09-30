# Client Module

## Web Interface Layer
Frontend implementation providing responsive collection and image management interfaces using custom MVC architecture with TypeScript, server-side rendering, and client-side hydration.

## Exports
```typescript
// Routes are exported directly from src/routes.ts
import { routes } from './client/src/routes';
```

## Architecture Principles
- **Custom MVC Framework**: TypeScript implementation with clear Model/View/Controller separation
- **Server-Side Rendering**: Express routes generate complete HTML pages for SEO and performance
- **Client-Side Hydration**: JavaScript bootstraps MVC components for rich interactivity
- **Type Safety**: Full TypeScript implementation with comprehensive type declarations
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Component-Based**: Reusable UI components with consistent data attributes

## Current Implementation Status

### ✅ Implemented Features

#### Home Page (`/`)
- **Collection Viewing**: Responsive card-based layout displaying all collections
- **Collection Creation**: Inline form for creating new collections with client-side validation
- **Navigation**: Direct links to individual collection pages
- **State Management**: Loading, success, empty, and error states
- **Responsive Design**: Optimized layouts for mobile (375px), tablet (768px), and desktop (1920px+)

#### Collection Page (`/collection/:name`)
- **Image Grid Display**: Responsive grid layout with 1-3 columns based on viewport
- **Status-Based Filtering**: Dynamic filtering by COLLECTION, INBOX, ARCHIVE status via URL parameters
- **Curate Mode**: Toggle-activated curation interface for bulk operations with sticky menu
- **Image Selection**: Individual image selection/deselection with visual blue border indicators in curate mode
- **Bulk Selection Operations**: Select All and Clear buttons for efficient multi-image operations
- **Image Status Management**: Keep, Discard, and Restore operations with optimistic UI updates
- **Image Deletion**: Permanent deletion of ARCHIVE images with confirmation dialog and batched processing
- **Image Download**: Download selected images to local filesystem - single images with original filename, multiple images as ZIP archive with format `{collection}-{status}-images.zip`
- **Image Upload**: Upload button with dialog for file selection, batch processing with progress tracking, error handling, and automatic page reload on successful upload
- **Fullscreen Popover**: Click thumbnails to view original images in modal overlay (disabled in curate mode)
- **Keyboard Status Updates**: Tab/Backspace shortcuts for efficient image status changes while viewing fullscreen
- **Slideshow Mode**: Fullscreen slideshow with randomized image sequence, auto-advance every 5 seconds, keyboard controls, and error handling
- **Lazy Loading**: Efficient image thumbnail loading with layout shift prevention
- **Auto-Redirect**: Automatic redirect to `?status=COLLECTION&curate=false` when parameters not specified
- **Error Handling**: 404 for non-existent collections, server error handling

### ⏳ Pending Implementation
- **Settings Page**: User preferences and configuration
- **Enhanced Upload UX**: Drag-and-drop interface with real-time progress indicators

## MVC Architecture Implementation

### Directory Structure
```text
client/src/
├── mvc.ts                # Base Model, View, Controller classes
├── routes.ts             # Express router definitions and page routing
├── pages/
│   ├── home/            # Home page MVC implementation
│   │   ├── model.ts     # HomePageModel - data management and API integration
│   │   ├── view.ts      # HomePageView - HTML generation and templating
│   │   └── controller.ts # HomePageController - event handling (pending)
│   └── collection/      # Collection page MVC implementation
│       ├── model.ts     # CollectionPageModel - image data and filtering
│       ├── view.ts      # CollectionPageView - responsive grid rendering
│       └── controller.ts # CollectionPageController - interactions (pending)
├── styles/
│   └── input.css        # Tailwind CSS configuration
└── mockups/             # HTML mockups for UI reference
```

### MVC Patterns
- **Models**: Manage page state, API integration, and data serialization for client hydration
  - Home Page Model: Collection list management, creation form state, validation logic
  - Collection Page Model: Image filtering, popover state management, error handling
- **Views**: Generate HTML using template literals with complete page rendering
- **Controllers**: Handle user interactions and coordinate model/view updates (client-side)
- **Focus Management**: Automatic focus preservation across page updates
- **State Serialization**: Server-rendered data hydrated into client-side models

### Model Capabilities
- **HomePageModel**: Collection CRUD operations, form validation, loading states, error handling
- **CollectionPageModel**: Image display management, status filtering, curate mode state, image selection management, download state management, popover state with enhanced navigation (`advancePopoverToNext()` with auto-close and graceful handling, `advancePopoverToPrevious()`), slideshow state with random sequencing, focus control

## Responsive Design System

### Viewport Breakpoints
- **Mobile**: 375px - 767px (1-column image grid, compact navigation)
- **Tablet**: 768px - 1199px (2-column image grid, medium spacing)
- **Desktop**: 1200px+ (3-column image grid, generous spacing)

### Layout Specifications
- **Container**: `max-w-4xl` centered with responsive padding
- **Typography**: Responsive text sizing with `text-base lg:text-lg` patterns
- **Grid System**: CSS Grid with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Spacing**: Consistent spacing scale using Tailwind utilities

## Styling with Tailwind CSS v4

### Configuration
- **Version**: Tailwind CSS v4 (latest)
- **Build Tool**: `@tailwindcss/cli` for compilation
- **Input**: `client/src/styles/input.css` (single `@import "tailwindcss";` directive)
- **Output**: `public/style.css` (served to browser)
- **Watch Mode**: Integrated with development workflow

### Usage Patterns
Tailwind utility classes used directly in TypeScript template literals:

```typescript
renderImageGrid() {
    return /*html*/`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-id="image-grid">
            ${this.renderImageCards()}
        </div>
    `;
}
```

### Build Commands
- `npm run css:watch` - Watch and rebuild CSS during development
- `npm run dev` - Starts CSS watch alongside TypeScript and server

## Page Implementations

### Home Page Features
- **Collection Cards**: Clean card layout with hover effects and navigation
- **Collection Creation Form**: Inline form with real-time client-side validation
- **State Management**: Loading states, empty states, error handling
- **Data Integration**: Direct domain integration via `Collection.list()`
- **User Messages**: Contextual messaging for all states
- **Accessibility**: Proper ARIA attributes and semantic HTML

#### Collection Creation
- **Validation Rules**: Non-empty, max 256 characters, alphanumeric with hyphens/underscores only
- **Real-time Validation**: Client-side validation on submit with immediate feedback
- **Duplicate Detection**: Prevents creation of collections with existing names
- **Loading States**: Submit button shows spinner during creation requests
- **Form Reset**: Input clears after successful creation, remains accessible for additional collections

#### State Messages
- **Empty State**: "No Collections found, create one to get started"
- **Error State**: "Unable to load collections"
- **Loading State**: Graceful loading indication
- **Validation Errors**: "Collection name is required", "Collection names may only contain letters, numbers, underscores and hyphens", etc.

### Collection Page Features
- **Dynamic Filtering**: URL-based status filtering (`?status=COLLECTION|INBOX|ARCHIVE`)
- **Image Thumbnails**: Optimized 400px thumbnails via `/api/images/:id/:imageId/thumbnail`
- **Fullscreen Image Viewing**: Click any thumbnail to view original image in modal popover
- **Responsive Grid**: Automatic column adjustment based on viewport
- **Lazy Loading**: `loading="lazy"` with proper width/height attributes
- **Layout Shift Prevention**: Consistent image dimensions

#### Fullscreen Popover
- **Original Image Display**: Shows full-resolution images from `/api/images/:collectionId/:imageId`
- **Viewport Optimization**: Images scale to fit viewport with 10px padding
- **Background Overlay**: Semi-transparent blurred background for focus
- **Multiple Close Methods**: Click background, press Esc key, or close button
- **Image Navigation**: Slideshow-like navigation through collection images while popover is open
  - `ENTER` key - Advance to next image in collection sequence
  - Mouse wheel down - Advance to next image
  - Mouse wheel up - Go back to previous image
  - Wraparound navigation (next from last image goes to first, previous from first goes to last)
- **Keyboard Status Updates**: Context-sensitive image status modification while viewing fullscreen
  - `TAB` key - Keep INBOX images (move to COLLECTION), Restore ARCHIVE images (move to COLLECTION)
  - `BACKSPACE` key - Discard INBOX/COLLECTION images (move to ARCHIVE)
  - Context constraints: COLLECTION images don't respond to Tab, ARCHIVE images don't respond to Backspace
  - Success messages: "Image moved to COLLECTION" or "Image moved to ARCHIVE" with 500ms timing
  - Automatic image advancement after successful status updates
  - Error messages: "Unable to update image status" with 500ms timeout
  - **Grid Synchronization**: Updated images are immediately removed from filtered view ensuring grid reflects changes when exiting fullscreen
  - **Auto-Close Behavior**: Fullscreen mode automatically closes when updating the last image in a filtered view, displaying appropriate empty state
- **Layout Shift Prevention**: Status messages use absolute positioning with backdrop overlay to prevent content jumping
- **Responsive Design**: Works across mobile, tablet, and desktop viewports
- **Error Handling**: "Unable to load full image" message for loading failures
- **Focus Management**: Keyboard focus trapped within popover during display
- **Status Filtering**: Navigation respects current status filter (COLLECTION, INBOX, ARCHIVE)

#### Slideshow Mode
- **Fullscreen Display**: Immersive fullscreen image viewing experience with black background
- **Random Image Sequence**: Fisher-Yates shuffle algorithm ensures non-repeating random order until all images shown
- **Auto-Advance**: Automatic progression every 5 seconds with pause/resume capability
- **Keyboard Controls**:
  - `ESC` - Close slideshow and return to collection page
  - `SPACE` - Toggle pause/resume with visual pause symbol (⏸) indicator
  - `ENTER` - Manual advance to next random image
- **Error Handling**: Graceful handling of failed image loads with automatic skipping to next image
- **State Preservation**: Curate mode selection state maintained across slideshow open/close operations
- **Complete Cycling**: After all images shown once, reshuffles and starts new randomized sequence
- **Responsive Design**: Scales images to fit viewport while maintaining aspect ratio

#### URL Structure
```
/collection/my-collection                    → Redirects to ?status=COLLECTION
/collection/my-collection?status=COLLECTION  → Shows curated images
/collection/my-collection?status=INBOX       → Shows new images
/collection/my-collection?status=ARCHIVE     → Shows archived images
```

## Error Handling Strategy
- **User-Friendly Messages**: Business-focused error messages, not technical details
- **Graceful Degradation**: Functional fallbacks for JavaScript failures
- **State Preservation**: Error states maintain user context
- **Focus Management**: Accessibility preserved during error scenarios
- **Console Logging**: Detailed technical information for developers

## Testing Infrastructure

### Test Architecture
- **Playwright Integration**: Full browser testing against live rendered pages
- **UI Model Pattern**: Page object model with assertable wrappers
- **Real Data**: Tests use actual domain data, not mocks
- **Responsive Testing**: Viewport size testing for mobile/tablet/desktop
- **Error Simulation**: Server-side error injection for comprehensive coverage

### UI Model Hierarchy
```text
client/tests/ui-model/
├── base/
│   ├── element.ts       # Base element interactions and assertions
│   ├── page.ts         # Base page model with common functionality
│   └── ui.ts           # UI abstraction layer with navigation
├── pages/
│   ├── home.ts         # HomePage model with collection card interactions
│   └── collection.ts   # CollectionPage model with image grid functionality
├── components/
│   ├── collection-card.ts  # Reusable collection card component
│   └── image-grid.ts       # Image grid component with responsive assertions
└── image-vault.ts      # Application-level model for cross-page functionality
```

### Key Testing Utilities
- **`shouldHaveColumnCount(count)`**: Validates responsive grid columns
- **`shouldHaveImageCard(imageId)`**: Validates individual image card presence
- **`shouldShowUserMessage(message)`**: Validates state messaging
- **`shouldRedirectTo(url)`**: Validates navigation and redirects
- **`shouldHaveProperLazyLoading()`**: Validates image loading attributes

## Data Attributes for Testing
All interactive elements include `data-id` attributes for reliable test automation:

```html
<!-- Collection cards -->
<div data-id="collection-card-${collectionName}">
  <h3 data-id="collection-title">${collectionName}</h3>
</div>

<!-- Collection creation form -->
<form data-id="collection-creation-form">
  <input data-id="collection-name-input" placeholder="Add a new Collection..." />
  <button data-id="collection-submit-button">Create</button>
  <div data-id="validation-message">${validationError}</div>
</form>

<!-- Image grid and cards -->
<div data-id="image-grid">
  <div data-id="image-card-${imageId}" data-selected="${isSelected}" data-image-id="${imageId}">
    <img data-id="image-thumbnail" src="/api/images/${collection}/${imageId}/thumbnail" />
  </div>
</div>

<!-- Curate mode elements -->
<button data-id="curate-button" aria-pressed="${isSelected}">Curate</button>
<div data-id="curation-menu">
  <button data-id="select-all-button">Select All</button>
  <button data-id="clear-button">Clear</button>
  <button data-id="download-button" data-loading="${isDownloading}">Download</button>
  <button data-id="keep-button">Keep</button>
  <button data-id="discard-button">Discard</button>
  <button data-id="restore-button">Restore</button>
  <button data-id="delete-button">Delete</button>
  <div data-id="curation-error-message">${errorMessage}</div>
</div>

<!-- Confirmation dialog -->
<div data-id="confirmation-dialog">
  <div data-id="confirmation-message">${message}</div>
  <button data-id="cancel-button">Cancel</button>
  <button data-id="confirm-delete-button">Delete</button>
</div>

<!-- Fullscreen popover -->
<div data-id="fullscreen-popover">
  <img data-id="popover-image" src="/api/images/${collection}/${imageId}" />
  <div data-id="popover-error">${errorMessage}</div>
  <div data-id="popover-status-message">${statusMessage}</div>
</div>

<!-- Slideshow -->
<button data-id="slideshow-button" disabled="${hasNoImages}">Slideshow</button>
<div data-id="slideshow">
  <img data-id="slideshow-image" src="/api/images/${collection}/${imageId}" />
  <div data-id="pause-symbol">⏸</div>
</div>

<!-- State messages -->
<div data-id="user-message">${message}</div>
<div data-id="error-message">${errorMessage}</div>
<div data-id="empty-message">${emptyMessage}</div>
```

## Performance Optimizations
- **Server-Side Rendering**: Initial page load without JavaScript dependency
- **Lazy Loading**: Images load only when entering viewport
- **CDN-Ready**: Static assets optimized for CDN caching
- **Layout Shift Prevention**: Proper image dimensions prevent content jumps
- **Efficient Hydration**: Minimal client-side JavaScript for interactivity
