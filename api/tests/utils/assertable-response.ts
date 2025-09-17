import { expect } from 'chai';

export class AssertableResponse<ResponseBody> {
    public raw: Response;
    public body?: ResponseBody | undefined;
    public text?: string | undefined;
    public buffer?: ArrayBuffer | undefined;

    private constructor(raw: Response, body?: ResponseBody, text?: string, buffer?: ArrayBuffer) {
        this.raw = raw;
        this.body = body;
        this.text = text;
        this.buffer = buffer;
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

        const buffer = await response
            .clone()
            .arrayBuffer()
            .catch(() => undefined);

        return new AssertableResponse<ResponseBody>(response, body, text, buffer);
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

    shouldHaveImageContent(expectedBuffer: Buffer): AssertableResponse<ResponseBody> {
        expect(this.buffer, 'Response does not contain binary content for image').to.not.equal(undefined);
        expect(this.buffer!.byteLength, 'Image content is empty').to.be.greaterThan(0);

        const responseBuffer = Buffer.from(this.buffer!);
        expect(responseBuffer.equals(expectedBuffer), 'Image content does not match expected binary data').to.be.true;
        console.log(`\tResponse contains expected image content (${this.buffer!.byteLength} bytes, verified)`);
 
        return this;
    }

    shouldHaveContentLength(expectedSize: number): AssertableResponse<ResponseBody> {
        const contentLength = this.raw.headers.get('Content-Length');
        expect(contentLength, 'Response does not have Content-Length header').to.not.equal(null);

        const actualSize = parseInt(contentLength!);
        expect(actualSize, 'Content-Length header is not a valid number').to.be.greaterThan(0);

        expect(actualSize, 'Content-Length does not match expected file size').to.equal(expectedSize);
        console.log(`\tResponse has Content-Length: ${actualSize} bytes (matches expected)`);

        return this;
    }

    shouldHaveCacheHeaders(): AssertableResponse<ResponseBody> {
        // Validate immutable content cache headers
        const cacheControl = this.raw.headers.get('Cache-Control');
        expect(cacheControl, 'Response does not have Cache-Control header for immutable content').to.not.equal(null);

        // Should contain directives for immutable content (images don't change)
        expect(cacheControl, 'Cache-Control header should include immutable content directives').to.match(/public|max-age/);
        console.log(`\tResponse has cache headers: Cache-Control: ${cacheControl}`);

        return this;
    }

    shouldHaveImageMimeType(expectedMime?: string): AssertableResponse<ResponseBody> {
        const contentType = this.raw.headers.get('Content-Type');
        expect(contentType, 'Response does not have Content-Type header').to.not.equal(null);

        const validImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
        const isValidImageMime = validImageMimes.some(mime => contentType!.includes(mime));
        expect(isValidImageMime, `Content-Type "${contentType}" is not a valid image MIME type`).to.be.true;

        if (expectedMime) {
            expect(contentType, `Content-Type does not match expected MIME type`).to.include(expectedMime);
            console.log(`\tResponse has Content-Type: ${contentType} (matches expected: ${expectedMime})`);
        } else {
            console.log(`\tResponse has valid image Content-Type: ${contentType}`);
        }

        return this;
    }
}
