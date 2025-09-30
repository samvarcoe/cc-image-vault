# Image Vault

## Problem Statement
Users have accumulated large collections of images across multiple directories that contain many duplicates and unwanted or low quality items. Currently, there's no efficient way to sort through these images to identify which are worth keeping and it's difficult to find images the user is interested in. Organising the images is an awkward and time-consuming manual process and as a result, the images are rarely viewed, negating the point of collecting or storing them.

## Solution Overview
A complete web application for image curation that enables users to upload, organize, and manage image collections. Features include drag-and-drop upload, comprehensive validation, duplicate detection, status-based filtering, and responsive viewing interfaces.

## Application Architecture

### Three-Layer Architecture
The application follows a clean three-layer architecture with clear separation of concerns:

- **Domain** (`domain/`): Business logic and data operations - see [Domain README](domain/README.md)
- **API** (`api/`): HTTP interface and routing - see [API README](api/README.md)
- **Client** (`client/`): Web interface and user interactions - see [Client README](client/README.md)

### Module Communication
- **UI → API**: HTTP requests for data and page rendering
- **API → Domain**: Method calls for business logic execution
- **Domain → API**: Return values and domain events
- **API → UI**: HTTP responses with data or rendered HTML

### Navigation Structure
```
/ (Home)                                    ✅ Implemented
├── /collection/:name?status=COLLECTION     ✅ Implemented
│   ├── ?status=INBOX                       ✅ Implemented
│   └── ?status=ARCHIVE                     ✅ Implemented
├── /collection/:name/slideshow             ⏳ Pending
└── /settings                               ⏳ Pending
```

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 24 with TypeScript
- **Web Framework**: Express with custom MVC implementation
- **Database**: SQLite (one per collection)
- **Image Processing**: Sharp library for thumbnails and metadata
- **Frontend**: Server-side rendering with client-side hydration
- **Styling**: Tailwind CSS v4
- **Testing**: Mocha + Playwright with executable specifications

### Data Architecture
Each collection maintains its own isolated SQLite database with an images table containing metadata, validation, and status information. Original images and thumbnails are stored in organized directory structures with UUID-based naming for security and performance.

For detailed schema and API specifications, see the module-specific documentation.

## Development Workflow

### Getting Started
```bash
npm run dev              # Start all development processes (TypeScript, CSS, server)
npm run tests:all        # Run all test suites across modules
npm run lint             # Code linting and style checks
npx tsc --noEmit         # Type checking without compilation
```

### Module-Specific Commands
```bash
npm run domain:tests     # Domain layer business logic tests
npm run api:tests        # API layer HTTP integration tests
npm run client:tests     # Client layer UI tests (Playwright)
```

For detailed development setup and module-specific workflows, refer to the individual module README files.

## Project Structure

```
├── api/                  # HTTP interface layer - see api/README.md
├── client/               # Web interface layer - see client/README.md
├── domain/               # Business logic layer - see domain/README.md
├── utils/                # Shared utilities across modules
├── private/              # Collection data storage (gitignored)
├── public/               # Static web assets
├── config.ts             # Project configuration
└── server.ts             # Application entry point
```

Each module follows a consistent structure with `requirements/`, `src/`, `tests/`, and dedicated documentation.

## Testing Philosophy

This project uses **executable specifications** - all functionality is defined in Gherkin scenarios that directly correspond to acceptance tests. Key principles:

- **Specification-Driven Development**: Features defined before implementation
- **Layer-Specific Testing**: Each architecture layer tested independently
- **Real System Testing**: Tests execute against live implementations
- **Business-Focused Assertions**: User-centric error messages and behavior

For detailed testing strategies and utilities, see the individual module README files.

## Development Principles

### Code Organization
- **Clear Module Boundaries**: Each layer has distinct responsibilities
- **Type Safety**: Comprehensive TypeScript coverage
- **Security First**: Input validation and XSS prevention throughout
- **Performance Conscious**: Lazy loading, caching, and optimized queries

### Error Handling Chain
- **Domain**: Throws business-specific exceptions
- **API**: Translates domain exceptions to HTTP status codes
- **Client**: Displays user-friendly error messages

### Cross-Module Standards
- **Import Strategy**: Use `@/<module>` for cross-module imports, relative imports within modules
- **Testing**: All modules use Mocha with custom assertions
- **Documentation**: Gherkin requirements mirror test structure 1:1

## Success Metrics

### ✅ Current Capabilities
- Complete collection viewing and management workflow
- Responsive image display with status-based filtering
- Fullscreen popover with slideshow-like navigation (ENTER key, mouse wheel)
- Keyboard-based image status updates in fullscreen mode (Tab/Backspace shortcuts)
- Context-sensitive status update constraints and user messaging
- Enhanced fullscreen status updates with grid synchronization and auto-close behavior
- Curate mode with image selection functionality (multi-select, Select All/Clear)
- Image download capability (single images with original filename, batch as ZIP archives)
- HTTP API for image uploads with comprehensive validation (JPG/JPEG, PNG, WebP)
- Robust error handling and user feedback
- Comprehensive test coverage across all layers

### 🎯 Next Development Priorities
- Client-side image upload interface with drag-and-drop
- Collection creation UI workflow
- Additional bulk image operations and organization features