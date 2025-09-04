/**
 * Utilities for Collection management
 */

/**
 * Validates a collection name for safety and compliance
 * Collection names must contain only letters, numbers, and hyphens
 * This ensures filesystem safety and JSON/HTML compatibility
 * 
 * @param name - The collection name to validate
 * @throws {Error} "Collection name cannot be empty" - when name is empty/whitespace
 * @throws {Error} "X is not a valid Collection name" - when name contains invalid characters
 */
export const validateCollectionName = (name: string): void => {
  if (!name.trim()) {
    throw new Error('Collection name cannot be empty');
  }

  const validNamePattern = /^[a-zA-Z0-9-]+$/;
  if (!validNamePattern.test(name)) {
    throw new Error(`"${name}" is not a valid Collection name`);
  }
}