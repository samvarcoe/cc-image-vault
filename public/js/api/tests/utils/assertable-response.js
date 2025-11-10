import { expect } from 'chai';
import AdmZip from 'adm-zip';
export class AssertableResponse {
    constructor(raw, body, text, buffer) {
        this.raw = raw;
        this.body = body;
        this.text = text;
        this.buffer = buffer;
    }
    static async fromResponse(response) {
        const body = (await response
            .clone()
            .json()
            .catch(() => undefined));
        const text = await response
            .clone()
            .text()
            .catch(() => undefined);
        const buffer = await response
            .clone()
            .arrayBuffer()
            .catch(() => undefined);
        return new AssertableResponse(response, body, text, buffer);
    }
    shouldBeOK() {
        expect(this.raw.ok, 'Response is not OK').to.equal(true);
        LOGGER.log('\tResponse is OK');
        return this;
    }
    shouldHaveStatus(status) {
        expect(this.raw.status, 'Response has unexpected status').to.equal(status);
        LOGGER.log(`\tResponse has status: ${status}`);
        return this;
    }
    shouldHaveText(text) {
        expect(this.text, 'Response has unexpected text').to.equal(text);
        LOGGER.log(`\tResponse has text: "${text}"`);
        return this;
    }
    shouldHaveBody(body) {
        expect(this.body, 'Response does not have expected body').to.deep.equal(body);
        LOGGER.log('\tResponse has expected body');
        return this;
    }
    shouldHavePartialBody(expectedPartial) {
        expect(this.body, 'Response body does not match expected partial value').to.containSubset(expectedPartial);
        LOGGER.log('\tResponse body matches expected partial value');
        return this;
    }
    shouldHaveBodyWithProperty(key, value) {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);
        expect(this.body, `Response body does not contain key: "${key}"`).to.haveOwnProperty(key);
        LOGGER.log(`\tResponse body contains key: "${key}"`);
        if (value !== undefined) {
            expect(this.body, `Response body has unexpected value for key: "${key}"`).to.haveOwnProperty(key, value);
            LOGGER.log(`\tResponse body has key: "${key}" with value: "${value}"`);
        }
        return this;
    }
    shouldNotHaveBodyWithProperty(key, value) {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);
        if (value !== undefined) {
            expect(this.body, `Response body should not have key: "${key}" with value: "${value}"`).to.not.haveOwnProperty(key, value);
            LOGGER.log(`\tResponse body does not contain key: "${key}" with value: "${value}"`);
        }
        else {
            expect(this.body, `Response body should not have key: "${key}"`).to.not.haveOwnProperty(key);
            LOGGER.log(`\tResponse body does not contain key: "${key}"`);
        }
        return this;
    }
    shouldHaveBodyWithNestedProperty(key, value) {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);
        expect(this.body, `Response body does not contain nested key: "${key}"`).to.have.nested.property(key);
        LOGGER.log(`\tResponse body contains nested key: "${key}"`);
        if (value !== undefined) {
            expect(this.body, `Response body has unexpected value for nested key: "${key}"`).to.have.nested.property(key, value);
            LOGGER.log(`\tResponse body has nested key: "${key}" with value: "${value}"`);
        }
        return this;
    }
    shouldNotHaveBodyWithNestedProperty(key, value) {
        expect(this.body, 'Response body is undefined').to.not.equal(undefined);
        if (value !== undefined) {
            const failureMessage = `Response body should not have nested key: "${key}" with value: "${value}"`;
            expect(this.body, failureMessage).to.not.have.nested.property(key, value);
            LOGGER.log(`\tResponse body does not contain nested key: "${key}" with value: "${value}"`);
        }
        else {
            expect(this.body, `Response body should not have nested key: "${key}"`).to.not.have.nested.property(key);
            LOGGER.log(`\tResponse body does not contain nested key: "${key}"`);
        }
        return this;
    }
    shouldHaveHeader(name, value) {
        const headerValue = this.raw.headers.get(name);
        expect(headerValue, `Response does not have header: "${name}"`).to.not.equal(null);
        LOGGER.log(`\tResponse has header: "${name}"`);
        if (value !== undefined) {
            expect(headerValue, `Response header "${name}" has unexpected value`).to.equal(value);
            LOGGER.log(`\tResponse has header: "${name}" with value: "${value}"`);
        }
        return this;
    }
    shouldNotHaveHeader(name) {
        const headerValue = this.raw.headers.get(name);
        expect(headerValue, `Response should not have header: "${name}"`).to.equal(null);
        LOGGER.log(`\tResponse does not have header: "${name}"`);
        return this;
    }
    shouldHaveMultiValueHeader(name, expectedValues) {
        const headerValue = this.raw.headers.get(name);
        const headerArray = headerValue === null || headerValue === void 0 ? void 0 : headerValue.split(',').map((value) => value.trim());
        expect(headerValue, `Response does not have header: "${name}"`).to.not.equal(null);
        expect(headerArray, `Response multi-value header "${name}" does not match expected values`).to.have.members(expectedValues);
        LOGGER.log(`\tResponse has multi-value header: "${name}" with expected values`);
        return this;
    }
    shouldHaveHeaderThatSatisfies(name, assertionFunction) {
        const headerValue = this.raw.headers.get(name);
        expect(headerValue, `Response does not have header: "${name}"`).to.not.equal(null);
        assertionFunction(headerValue);
        return this;
    }
    shouldHaveImageContent(expectedBuffer) {
        expect(this.buffer, 'Response does not contain binary content for image').to.not.equal(undefined);
        expect(this.buffer.byteLength, 'Image content is empty').to.be.greaterThan(0);
        const responseBuffer = Buffer.from(this.buffer);
        expect(responseBuffer.equals(expectedBuffer), 'Image content does not match expected binary data').to.be.true;
        LOGGER.log(`\tResponse contains expected image content (${this.buffer.byteLength} bytes, verified)`);
        return this;
    }
    shouldHaveContentLength(expectedSize) {
        const contentLength = this.raw.headers.get('Content-Length');
        expect(contentLength, 'Response does not have Content-Length header').to.not.equal(null);
        const actualSize = parseInt(contentLength);
        expect(actualSize, 'Content-Length header is not a valid number').to.be.greaterThan(0);
        expect(actualSize, 'Content-Length does not match expected file size').to.equal(expectedSize);
        LOGGER.log(`\tResponse has Content-Length: ${actualSize} bytes (matches expected)`);
        return this;
    }
    shouldHaveCacheHeaders() {
        const cacheControl = this.raw.headers.get('Cache-Control');
        expect(cacheControl, 'Response does not have Cache-Control header for immutable content').to.not.equal(null);
        expect(cacheControl, 'Cache-Control header should include immutable content directives').to.match(/public|max-age/);
        LOGGER.log(`\tResponse has cache headers: Cache-Control: ${cacheControl}`);
        return this;
    }
    shouldHaveImageMimeType(expectedMime) {
        const contentType = this.raw.headers.get('Content-Type');
        expect(contentType, 'Response does not have Content-Type header').to.not.equal(null);
        const validImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
        const isValidImageMime = validImageMimes.some(mime => contentType.includes(mime));
        expect(isValidImageMime, `Content-Type "${contentType}" is not a valid image MIME type`).to.be.true;
        if (expectedMime) {
            expect(contentType, `Content-Type does not match expected MIME type`).to.include(expectedMime);
            LOGGER.log(`\tResponse has Content-Type: ${contentType} (matches expected: ${expectedMime})`);
        }
        else {
            LOGGER.log(`\tResponse has valid image Content-Type: ${contentType}`);
        }
        return this;
    }
    shouldHaveContentDispositionAttachment(expectedFilename) {
        const contentDisposition = this.raw.headers.get('Content-Disposition');
        expect(contentDisposition, 'Response does not have Content-Disposition header').to.not.equal(null);
        expect(contentDisposition, 'Content-Disposition header does not contain "attachment"').to.include('attachment');
        LOGGER.log(`\tResponse has Content-Disposition header with attachment directive`);
        if (expectedFilename) {
            expect(contentDisposition, `Content-Disposition header does not contain expected filename`).to.include(`filename="${expectedFilename}"`);
            LOGGER.log(`\tResponse has Content-Disposition with filename: "${expectedFilename}"`);
        }
        return this;
    }
    shouldHaveZipContent(expectedFiles) {
        expect(this.buffer, 'Response does not contain binary content for ZIP').to.not.equal(undefined);
        expect(this.buffer.byteLength, 'ZIP content is empty').to.be.greaterThan(0);
        const extractedFiles = [];
        const zip = new AdmZip(Buffer.from(this.buffer));
        const zipEntries = zip.getEntries();
        for (const entry of zipEntries) {
            if (!entry.isDirectory) {
                extractedFiles.push({
                    name: entry.entryName,
                    content: entry.getData()
                });
            }
        }
        expect(extractedFiles.length, `ZIP archive contains ${extractedFiles.length} files, expected ${expectedFiles.length}`).to.equal(expectedFiles.length);
        LOGGER.log(`\tZIP archive contains ${extractedFiles.length} file(s)`);
        for (const expectedFile of expectedFiles) {
            const actualFile = extractedFiles.find(f => f.name === expectedFile.name);
            expect(actualFile, `ZIP archive does not contain expected file: "${expectedFile.name}"`).to.not.equal(undefined);
            const contentMatches = actualFile.content.equals(expectedFile.content);
            expect(contentMatches, `File "${expectedFile.name}" content does not match expected data`).to.be.true;
            LOGGER.log(`\tZIP contains file "${expectedFile.name}" with correct content (${expectedFile.content.length} bytes)`);
        }
        return this;
    }
}
