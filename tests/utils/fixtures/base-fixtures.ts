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
    
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join(', ');
      throw new Error(`Fixture cleanup failed: ${errors.length} errors occurred during resource cleanup (${errorMessages})`);
    }

    console.log(`✓ All ${this.cleanupFunctions.length} fixtures cleaned up successfully`);
    this.cleanupFunctions = [];
  }

  static get count(): number {
    return this.cleanupFunctions.length;
  }
}