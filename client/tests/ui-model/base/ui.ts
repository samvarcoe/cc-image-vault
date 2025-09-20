import { expect, Page } from "playwright/test";

import { PageObject } from "./page";
import { Element } from "./element";

interface NetworkEvent {
    url: string;
    method: string;
    status?: number;
    statusText?: string;
    timestamp: string;
    type: 'request' | 'response' | 'failed';
    headers?: Record<string, string>;
    error?: string;
}

export abstract class UI {
    protected page: Page;
    private consoleErrors: string[] = [];
    private consoleWarnings: string[] = [];
    private networkEvents: NetworkEvent[] = [];
    private failedRequests: NetworkEvent[] = [];

    constructor(page: Page) {
        this.page = page;
        this.setupConsoleListeners();
        this.setupNetworkListeners();
    }

    // Set up console listeners immediately to capture all messages
    private setupConsoleListeners(): void {
        this.page.on('console', msg => {
            const timestamp = new Date().toISOString();
            const messageText = `[${timestamp}] ${msg.text()}`;

            if (msg.type() === 'error') {
                this.consoleErrors.push(messageText);
                LOGGER.log(`Console Error on ${this.constructor.name}: ${msg.text()}`);
                
            } else if (msg.type() === 'warning') {
                this.consoleWarnings.push(messageText);
            }
        });
    }

    // Set up network listeners to capture all requests and responses
    private setupNetworkListeners(): void {
        this.page.on('request', request => {
            const timestamp = new Date().toISOString();
            const event: NetworkEvent = {
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
            const event: NetworkEvent = {
                url: response.url(),
                method: response.request().method(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp,
                type: 'response',
                headers: response.headers()
            };
            this.networkEvents.push(event);

            // Track failed requests (4xx, 5xx status codes)
            if (response.status() >= 400) {
                this.failedRequests.push(event);
                LOGGER.log(`Failed Request on ${this.constructor.name}: ${response.status()} ${response.url()}`);
            }
        });

        this.page.on('requestfailed', request => {
            const timestamp = new Date().toISOString();
            const event: NetworkEvent = {
                url: request.url(),
                method: request.method(),
                timestamp,
                type: 'failed',
                error: request.failure()?.errorText || 'Unknown error'
            };
            this.networkEvents.push(event);
            this.failedRequests.push(event);
            LOGGER.log(`Request Failed on ${this.constructor.name}: ${request.url()} - ${event.error}`);
        });
    }

    protected element = (name: string, selector: string): Element => {
        return new Element(name, selector, this.page);
    };

    protected component = <T extends Element>(
        ComponentClass: new (name: string, selector: string, page: Page) => T,
        name: string,
        selector: string
    ): T => {
        return new ComponentClass(name, selector, this.page);
    };

    protected pageObject = <T extends PageObject>( PageClass: new (page: Page) => T ): T => {
        return new PageClass(this.page);
    };

    getCurrentUrl(): string {
        return this.page.url();
    }

    async getNetworkEvents(): Promise<NetworkEvent[]> {
        return [...this.networkEvents];
    }

    async getFailedRequests(): Promise<NetworkEvent[]> {
        return [...this.failedRequests];
    }

    async getRequestsForUrl(urlPattern: string | RegExp): Promise<NetworkEvent[]> {
        const pattern = typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern;
        return this.networkEvents.filter(event => pattern.test(event.url));
    }

    async getResponsesWithStatus(status: number): Promise<NetworkEvent[]> {
        return this.networkEvents.filter(event => event.type === 'response' && event.status === status);
    }

    async getConsoleErrors(): Promise<string[]> {
        return [...this.consoleErrors];
    }

    async getConsoleWarnings(): Promise<string[]> {
        return [...this.consoleWarnings];
    }

    async shouldHaveUrl(expectedUrl: string): Promise<void> {
        await this.page.waitForLoadState('networkidle');
        const currentUrl = this.getCurrentUrl();
        const currentPath = new URL(currentUrl).pathname;
        expect(currentPath, `The browser is not at url: ${expectedUrl}`).toBe(expectedUrl);
        LOGGER.log(`✓ The browser is at url: "${expectedUrl}"`);
    }

    async shouldHaveNoApiErrors(): Promise<void> {
        const apiRequests = await this.getRequestsForUrl('/api/');

        const failedApiRequests = apiRequests.filter(req => req.status && req.status >= 400);

        expect(failedApiRequests.length, { 
        message: `Found ${failedApiRequests.length} failed API requests instead of 0 during operation` 
        }).toBe(0);

        LOGGER.log('✓ No API request failures during operation');
    }

    async shouldHaveNoConsoleErrors(): Promise<void> {
        const consoleErrors = await this.getConsoleErrors();

        expect(consoleErrors.length, { 
        message: `Found ${consoleErrors.length} unexpected console errors: ${consoleErrors.join(', ')}` 
        }).toBe(0);
        
        LOGGER.log('✓ No unexpected console errors');
    }

    async shouldHaveNoFailedRequests(): Promise<void> {
        const failedRequests = await this.getFailedRequests();

        expect(failedRequests.length, { 
        message: `Found ${failedRequests.length} failed network requests instead of 0` 
        }).toBe(0);
        
        LOGGER.log('✓ No failed network requests');
    }
}