# Feature Notes - Collection Management

## Summary
Collection Management provides the core functionality for creating, loading, deleting, listing, and clearing isolated image collections. Each collection maintains its own directory structure with a SQLite database and organized image storage (original and thumbnails). The feature ensures atomic operations, proper error handling, and validates collection names for safety.

## Executable Specification
Requirement File: `domain/requirements/collection-management.feature`
Acceptance Test File: `domain/tests/acceptance/specs/collection-management.spec.ts`

**Scenarios**
1. User creates Collection with valid name
2. User attempts to create a Collection with duplicate name
3. User attempts to create a Collection with invalid name
4. An internal error occurs when creating a Collection
5. User loads Collection from filesystem
6. User attempts to load a non-existent Collection
7. An internal error occurs when loading a Collection
8. User deletes a Collection
9. User attempts to delete a Collection that does not exist
10. An internal error occurs when deleting a Collection
11. User requests list of existing Collections and some Collections exist
12. User requests list of existing Collections and no Collections exist
13. An internal error occurs when listing Collections
14. User clears Collections
15. User attempts to clear an empty Collections directory
16. An internal error occurs when the user attempts to clear the Collections directory

**Testing Notes**
The test implementation focuses on verification of filesystem side effects and proper error handling:

- **Fixture Management**: Uses existing `DirectoryFixtures` class for test environment setup and cleanup, creating temporary collections directories for isolated testing
- **Filesystem Validation**: Tests verify actual directory creation, SQLite database files, and proper file structure (images/original/, images/thumbnails/)
- **Error Mocking**: Uses sinon to mock filesystem operations (fs.mkdir, fs.stat, fs.rm, fs.readdir) to simulate internal errors while preserving the atomic operation requirements
- **Configuration Mocking**: Mocks `CONFIG.COLLECTIONS_DIRECTORY` to redirect operations to test directories, ensuring no interference with actual collections
- **State Verification**: Helper functions validate collection directory existence, SQLite file creation, proper file structure, and cleanup after errors
- **Business-Focused Assertions**: Error messages provide business context complementing Node.js diffs, focusing on user scenarios rather than technical implementation details
- **TDD Implementation**: Collection class stub throws "Pending Implementation" errors, allowing tests to define expected behavior before implementation