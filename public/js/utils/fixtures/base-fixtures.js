export class Fixtures {
    static addCleanup(cleanupFn) {
        this.cleanupFunctions.push(cleanupFn);
    }
    static async cleanup() {
        const results = await Promise.allSettled(this.cleanupFunctions.map(fn => fn()));
        const errors = results
            .filter((result) => result.status === 'rejected')
            .map(result => result.reason);
        if (errors.length > 0) {
            const errorMessages = errors.map(e => e.message).join(', ');
            throw new Error(`Fixture cleanup failed: ${errors.length} errors occurred during resource cleanup (${errorMessages})`);
        }
        LOGGER.log(`✓ All ${this.cleanupFunctions.length} fixtures cleaned up successfully`);
        this.cleanupFunctions = [];
    }
    static get count() {
        return this.cleanupFunctions.length;
    }
}
Fixtures.cleanupFunctions = [];
