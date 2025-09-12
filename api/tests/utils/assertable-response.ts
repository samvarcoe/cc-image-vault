import { expect } from 'chai';

export class AssertableResponse<ResponseBody> {
    public raw: Response;
    public body?: ResponseBody | undefined;
    public text?: string | undefined;

    private constructor(raw: Response, body?: ResponseBody, text?: string) {
        this.raw = raw;
        this.body = body;
        this.text = text;
    }

    static async fromResponse<ResponseBody>(response: Response): Promise<AssertableResponse<ResponseBody>> {
        const body = (await response
            .clone()
            .json()
            .catch(() => undefined)) as ResponseBody;

        const text = await response
            .clone()
            .text()
            .catch(() => undefined);

        return new AssertableResponse<ResponseBody>(response, body, text);
    }


    shouldBeOK(): AssertableResponse<ResponseBody> {
        expect(this.raw.ok, 'Response is not OK').to.equal(true);
        console.log('\tResponse is OK');
        return this;
    }

    shouldHaveStatus(status: number): AssertableResponse<ResponseBody> {
        expect(this.raw.status, 'Response has unexpected status').to.equal(status);
        console.log(`\tResponse has status: ${status}`);
        return this;
    }

    shouldHaveText(text: string): AssertableResponse<ResponseBody> {
        expect(this.text, 'Response has unexpected text').to.equal(text);
        console.log(`\tResponse has text: "${text}"`);
        return this;
    }

    shouldHaveBody(body: ResponseBody): AssertableResponse<ResponseBody> {
        expect(this.body, 'Response does not have expected body').to.deep.equal(body);
        console.log('\tResponse has expected body');
        return this;
    }

    shouldHavePartialBody(expectedPartial: Partial<ResponseBody>): AssertableResponse<ResponseBody> {
        expect(this.body, 'Response body does not match expected partial value').to.containSubset(expectedPartial);
        console.log('\tResponse body matches expected partial value');
        return this;
    }

    shouldHaveBodyWithProperty(key: string, value?: unknown): AssertableResponse<ResponseBody> {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);

        expect(this.body, `Response body does not contain key: "${key}"`).to.haveOwnProperty(key);
        console.log(`\tResponse body contains key: "${key}"`);

        if (value !== undefined) {
            expect(this.body, `Response body has unexpected value for key: "${key}"`).to.haveOwnProperty(key, value);
            console.log(`\tResponse body has key: "${key}" with value: "${value}"`);
        }

        return this;
    }

    shouldNotHaveBodyWithProperty(key: string, value?: unknown): AssertableResponse<ResponseBody> {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);

        if (value !== undefined) {
            expect(this.body, `Response body should not have key: "${key}" with value: "${value}"`).to.not.haveOwnProperty(
                key,
                value,
            );
            console.log(`\tResponse body does not contain key: "${key}" with value: "${value}"`);
        }

        else {
            expect(this.body, `Response body should not have key: "${key}"`).to.not.haveOwnProperty(key);
            console.log(`\tResponse body does not contain key: "${key}"`);
        }

        return this;
    }

    shouldHaveBodyWithNestedProperty(key: string, value?: unknown): AssertableResponse<ResponseBody> {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);

        expect(this.body, `Response body does not contain nested key: "${key}"`).to.have.nested.property(key);
        console.log(`\tResponse body contains nested key: "${key}"`);

        if (value !== undefined) {
            expect(this.body, `Response body has unexpected value for nested key: "${key}"`).to.have.nested.property(
                key,
                value,
            );
            console.log(`\tResponse body has nested key: "${key}" with value: "${value}"`);
        }

        return this;
    }

    shouldNotHaveBodyWithNestedProperty(key: string, value?: unknown): AssertableResponse<ResponseBody> {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);

        if (value !== undefined) {
            const failureMessage = `Response body should not have nested key: "${key}" with value: "${value}"`
            expect(this.body, failureMessage).to.not.have.nested.property(key, value);
            console.log(`\tResponse body does not contain nested key: "${key}" with value: "${value}"`);
        } else {
            expect(this.body, `Response body should not have nested key: "${key}"`).to.not.have.nested.property(key);
            console.log(`\tResponse body does not contain nested key: "${key}"`);
        }

        return this;
    }

    shouldHaveHeader(name: string, value?: string): AssertableResponse<ResponseBody> {
        const headerValue = this.raw.headers.get(name);
        expect(headerValue, `Response does not have header: "${name}"`).to.not.equal(null);
        console.log(`\tResponse has header: "${name}"`);

        if (value !== undefined) {
            expect(headerValue, `Response header "${name}" has unexpected value`).to.equal(value);
            console.log(`\tResponse has header: "${name}" with value: "${value}"`);
        }

        return this;
    }

    shouldNotHaveHeader(name: string): AssertableResponse<ResponseBody> {
        const headerValue = this.raw.headers.get(name);
        expect(headerValue, `Response should not have header: "${name}"`).to.equal(null);
        console.log(`\tResponse does not have header: "${name}"`);

        return this;
    }

    shouldHaveMultiValueHeader(name: string, expectedValues: string[]): AssertableResponse<ResponseBody> {
        const headerValue = this.raw.headers.get(name);
        const headerArray = headerValue?.split(',').map((value) => value.trim());

        expect(headerValue, `Response does not have header: "${name}"`).to.not.equal(null);
        expect(headerArray, `Response multi-value header "${name}" does not match expected values`).to.have.members(
            expectedValues,
        );

        console.log(`\tResponse has multi-value header: "${name}" with expected values`);

        return this;
    }

    shouldHaveHeaderThatSatisfies(name: string, assertionFunction: (value: string) => void): AssertableResponse<ResponseBody> {
        const headerValue = this.raw.headers.get(name);
        expect(headerValue, `Response does not have header: "${name}"`).to.not.equal(null);
        assertionFunction(headerValue!);
        return this;
    }
}
