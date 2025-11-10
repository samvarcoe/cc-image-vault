import { expect } from "playwright/test";
import { Element } from "./element";
export class UI {
    constructor(page) {
        this.consoleErrors = [];
        this.consoleWarnings = [];
        this.networkEvents = [];
        this.failedRequests = [];
        this.element = (name, selector) => {
            return new Element(name, selector, this.page);
        };
        this.component = (ComponentClass, name, selector) => {
            return new ComponentClass(name, selector, this.page);
        };
        this.pageObject = (PageClass) => {
            return new PageClass(this.page);
        };
        this.page = page;
        this.setupConsoleListeners();
        this.setupNetworkListeners();
    }
    setupConsoleListeners() {
        this.page.on('console', msg => {
            const timestamp = new Date().toISOString();
            const messageText = `[${timestamp}] ${msg.text()}`;
            if (msg.type() === 'error') {
                this.consoleErrors.push(messageText);
                LOGGER.log(`Console Error on ${this.constructor.name}: ${msg.text()}`);
            }
            else if (msg.type() === 'warning') {
                this.consoleWarnings.push(messageText);
            }
        });
    }
    setupNetworkListeners() {
        this.page.on('request', request => {
            const timestamp = new Date().toISOString();
            const event = {
                url: request.url(),
                method: request.method(),
                timestamp,
                type: 'request',
                headers: request.headers()
            };
            this.networkEvents.push(event);
        });
        this.page.on('response', response => {
            const timestamp = new Date().toISOString();
            const event = {
                url: response.url(),
                method: response.request().method(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp,
                type: 'response',
                headers: response.headers()
            };
            this.networkEvents.push(event);
            if (response.status() >= 400) {
                this.failedRequests.push(event);
                LOGGER.log(`Failed Request on ${this.constructor.name}: ${response.status()} ${response.url()}`);
            }
        });
    }
    getCurrentUrl() {
        return this.page.url();
    }
    async getNetworkEvents() {
        return [...this.networkEvents];
    }
    async getFailedRequests() {
        return [...this.failedRequests];
    }
    async getRequestsForUrl(urlPattern) {
        const pattern = typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern;
        return this.networkEvents.filter(event => pattern.test(event.url));
    }
    async getResponsesWithStatus(status) {
        return this.networkEvents.filter(event => event.type === 'response' && event.status === status);
    }
    async getConsoleErrors() {
        return [...this.consoleErrors];
    }
    async getConsoleWarnings() {
        return [...this.consoleWarnings];
    }
    async shouldHaveUrl(expectedUrl) {
        await this.page.waitForLoadState('networkidle');
        const currentUrl = this.getCurrentUrl();
        const currentPath = new URL(currentUrl).pathname;
        expect(currentPath, `The browser is not at url: ${expectedUrl}`).toBe(expectedUrl);
        LOGGER.log(`✓ The browser is at url: "${expectedUrl}"`);
    }
    async shouldHaveNoApiErrors() {
        const apiRequests = await this.getRequestsForUrl('/api/');
        const failedApiRequests = apiRequests.filter(req => req.status && req.status >= 400);
        expect(failedApiRequests.length, {
            message: `Found ${failedApiRequests.length} failed API requests instead of 0 during operation`
        }).toBe(0);
        LOGGER.log('✓ No API request failures during operation');
    }
    async shouldHaveNoConsoleErrors() {
        const consoleErrors = await this.getConsoleErrors();
        expect(consoleErrors.length, {
            message: `Found ${consoleErrors.length} unexpected console errors: ${consoleErrors.join(', ')}`
        }).toBe(0);
        LOGGER.log('✓ No unexpected console errors');
    }
    async shouldHaveNoFailedRequests() {
        const failedRequests = await this.getFailedRequests();
        expect(failedRequests.length, {
            message: `Found ${failedRequests.length} failed network requests instead of 0`
        }).toBe(0);
        LOGGER.log('✓ No failed network requests');
    }
}
