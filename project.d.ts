declare global {
    namespace Chai {
        interface Assertion {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            containSubset(expected: any): Assertion;
        }
        interface Assert {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            containSubset(val: any, exp: any, msg?: string): void;
        }
    }
}

declare module 'chai-subset'