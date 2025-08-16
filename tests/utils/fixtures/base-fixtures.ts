/**
 * Base fixtures class following the standard fixture pattern
 * Provides shared cleanup tracking for all fixture types
 */
export abstract class Fixtures<T> {
  private static cleanupFunctions: Array<() => Promise<void>> = [];

  protected static addCleanup(cleanupFn: () => Promise<void>): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  static async cleanup(): Promise<void> {
    const results = await Promise.allSettled(this.cleanupFunctions.map(fn => fn()));
    this.cleanupFunctions = [];
    
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    if (errors.length > 0) {
      console.error('Cleanup errors:', errors.map(e => e.message).join(', '));
      throw new Error(`Failed to cleanup fixtures: ${errors.length} errors occurred`);
    }
  }

  static get count(): number {
    return this.cleanupFunctions.length;
  }
}