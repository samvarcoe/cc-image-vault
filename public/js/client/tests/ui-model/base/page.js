import { expect } from "playwright/test";
import { Element } from "./element";
export class PageObject {
    constructor(page) {
        this.url = '/';
        this.element = (name, selector) => {
            return new Element(name, selector, this.page);
        };
        this.component = (ComponentClass, name, selector) => {
            return new ComponentClass(name, selector, this.page);
        };
        this.page = page;
    }
    async getTitle() {
        return await this.page.title();
    }
    async shouldBeOnPage(timeout = 2000) {
        LOGGER.log(`Verifying that the current page is: "${this.constructor.name}"`);
        const failureMessage = `Current page is not: "${this.constructor.name}"\n\tExpected URL pattern: ${this.url}\n\tCurrent URL: ${this.page.url()}`;
        await expect(this.page, { message: failureMessage }).toHaveURL(new RegExp(this.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout });
        LOGGER.log(`Current page is: "${this.constructor.name}"`);
    }
    async shouldHaveTitle(expectedTitle, timeout = 2000) {
        LOGGER.log(`Verifying that the page title is: "${expectedTitle}"`);
        const failureMessage = `Current page title is not: "${expectedTitle}"\n\tExpected title: "${expectedTitle}"\n\tCurrent title: "${await this.getTitle()}"`;
        await expect(this.page, { message: failureMessage }).toHaveTitle(expectedTitle, { timeout });
        LOGGER.log(`Page title is: "${expectedTitle}"`);
    }
}
