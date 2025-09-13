import { expect, Page } from "playwright/test";
import { Element } from "./element";

export abstract class PageObject {
    protected page: Page;
    protected url: string = '/';

    constructor(page: Page) {
        this.page = page;
    }

    async visit(timeout = 2000): Promise<void> {
        console.log(`Navigating to ${this.constructor.name}: ${this.url}`);
        await this.page.goto(this.url);
        await this.page.waitForLoadState('load', { timeout });;
        await this.shouldBeOnPage();
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

    async getTitle(): Promise<string> {
        return await this.page.title();
    }

    async shouldBeOnPage(timeout = 2000): Promise<void> {
        console.log(`Verifying that the current page is: "${this.constructor.name}"`);

        const failureMessage = `Current page is not: "${this.constructor.name}"\n\tExpected URL pattern: ${this.url}\n\tCurrent URL: ${this.page.url()}`;
        await expect(this.page, { message: failureMessage }).toHaveURL(new RegExp(this.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout });

        console.log(`Current page is: "${this.constructor.name}"`);
    }
    
    async shouldHaveTitle(expectedTitle: string, timeout = 2000): Promise<void> {
        console.log(`Verifying that the page title is: "${expectedTitle}"`);

        const failureMessage = `Current page title is not: "${expectedTitle}"\n\tExpected title: "${expectedTitle}"\n\tCurrent title: "${await this.getTitle()}"`;
        await expect(this.page, { message: failureMessage }).toHaveTitle(expectedTitle, { timeout });

        console.log(`Page title is: "${expectedTitle}"`);
    }
}