import { expect } from "chai";
export class AssertableError {
    constructor(error) {
        this.error = error;
    }
    shouldHaveType(errorType) {
        expect(this.error).instanceOf(errorType);
        LOGGER.log('✓ The Error was thrown with the expected instance type');
        return this;
    }
    shouldHaveMessage(message) {
        expect(this.error, 'The Error was not thrown with the expected message').has.property('message').includes(message);
        LOGGER.log('✓ The Error was thrown with the expected message');
        return this;
    }
    shouldHaveCause(causeType) {
        expect(this.error).has.property('cause').instanceOf(causeType);
        LOGGER.log('✓ The Error cause was thrown with the expected instance type');
        return this;
    }
    shouldHaveCauseMessage(message) {
        expect(this.error, 'The Error cause was not thrown with the expected message').has.property('cause').has.property('message').includes(message);
        LOGGER.log('✓ The Error cause was thrown with the expected message');
        return this;
    }
}
export const captureAssertableError = (fn) => {
    try {
        fn();
        throw new Error('Expected function to throw an error');
    }
    catch (error) {
        return new AssertableError(error);
    }
};
export const captureAssertableAsyncError = async (fn) => {
    try {
        await fn();
        throw new Error('Expected async function to throw an error');
    }
    catch (error) {
        return new AssertableError(error);
    }
};
