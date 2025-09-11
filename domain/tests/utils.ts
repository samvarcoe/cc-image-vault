import { expect } from "chai";

type ErrorConstructor<T extends Error = Error> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => T;

export class AssertableError {
  constructor(private error: unknown) {}
  
  shouldHaveType<T extends Error>(errorType: ErrorConstructor<T>): AssertableError {
    expect(this.error).instanceOf(errorType);
    console.log('✓ The Error was thrown with the expected instance type');
    return this;
  }
  
  shouldHaveMessage(message: string): AssertableError {
    expect(this.error, 'The Error was not thrown with the expected message').has.property('message').includes(message);
    console.log('✓ The Error was thrown with the expected message')
    return this;
  }
  
  shouldHaveCause<T extends Error>(causeType: ErrorConstructor<T>): AssertableError {
    expect(this.error).has.property('cause').instanceOf(causeType);
    console.log('✓ The Error cause was thrown with the expected instance type')
    return this;
  }
  
  shouldHaveCauseMessage(message: string): AssertableError {
    expect(this.error, 'The Error cause was not thrown with the expected message').has.property('cause').has.property('message').includes(message);
    console.log('✓ The Error cause was thrown with the expected message');
    return this;
  }
}

export const captureAssertableError = (fn: () => void): AssertableError => {
  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error: unknown) {
    return new AssertableError(error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const captureAssertableAsyncError = async (fn: () => Promise<any>): Promise<AssertableError> => {
  try {
    await fn();
    throw new Error('Expected async function to throw an error');
  } catch (error: unknown) {
    return new AssertableError(error);
  }
};