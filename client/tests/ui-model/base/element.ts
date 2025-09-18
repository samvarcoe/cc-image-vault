import { expect } from '@playwright/test';
import { Page, Locator } from '@playwright/test';

export type ElementConstructor<T> = new (name: string, selector: string, page: Page) => T;

export class Element {
    protected locator: Locator;

    constructor(public name: string, public selector: string, protected page: Page) {
        this.locator = this.page.locator(this.selector);
    }

    // Used to create a new instance of an element with a more specific name and selector
    deriveInstance = (name: string, selector: string): typeof this => {
        return new (this.constructor as ElementConstructor<typeof this>)(name, selector, this.page);
    };

    child = <T>(E: ElementConstructor<T>, name: string, selector: string): T => {
        const combinedSelector = `${this.selector} ${selector}`;
        return new E(`${this.name} > ${name}`, combinedSelector, this.page);
    };

    byIndex = (index: number) => {
        const indexSelector = `${this.selector} >> nth=${index}`;
        return this.deriveInstance(`${this.name}[${index}]`, indexSelector);
    };

    byText = (text: string) => {
        const textSelector = `${this.selector} >> text="${text}"`;
        return this.deriveInstance(`${this.name}[${text}]`, textSelector);
    };

    exists = async () => {
        try {
            await this.locator.waitFor({ state: 'attached', timeout: 1000 });
            return true;
        } catch {
            return false;
        }
    };

    displayed = async () => {
        try {
            await this.locator.waitFor({ state: 'visible', timeout: 1000 });
            return true;
        } catch {
            return false;
        }
    };

    count = async () => {
        return await this.locator.count();
    };

    scrollInToView = async () => {
        console.log(`Scrolling the ${this.name} element in to view`);
        await this.locator.scrollIntoViewIfNeeded();
    };

    click = async () => {
        console.log(`Clicking the ${this.name} element`);
        await this.locator.scrollIntoViewIfNeeded();
        await this.locator.click();
    };

    type = async (text: string, sensitive = false) => {
        console.log(`Typing "${sensitive ? '*******' : text}" in to ${this.name}`);
        await this.locator.fill(text);
    };

    setInputFiles = async (files: Array<{ name: string; mimeType: string; buffer: Buffer; }>) => {
        console.log(`Setting ${files.length} files on ${this.name}`);
        await this.locator.setInputFiles(files);
    };

    shouldBeDisplayed = async () => {
        console.log(`Verifying ${this.name} is visible on the page`);
        await expect(this.locator, `${this.name} is not visible on the page using selector: ${this.selector}`).toBeVisible();
        console.log(`${this.name} is confirmed as visible on the page`);
    };

    shouldNotBeDisplayed = async () => {
        console.log(`Verifying ${this.name} is not visible on the page`);
        await expect(this.locator, `${this.name} is visible on the page when it should be hidden using selector: ${this.selector}`).not.toBeVisible();
        console.log(`${this.name} is confirmed as not visible on the page`);
    };

    shouldNotExist = async (timeout = 2000) => {
        console.log(`Verifying ${this.name} does not exist in the DOM`);
        await expect(this.locator, `${this.name} exists in the DOM when it should be removed after ${timeout}ms timeout using selector: ${this.selector}`).not.toBeAttached({ timeout });
        console.log(`${this.name} is confirmed as not existing in the DOM`);
    };

    shouldHaveText = async (text: string | number, timeout = 2000) => {
        const expectedText = text.toString();
        console.log(`Verifying ${this.name} has exact text: "${expectedText}"`);

        await expect(this.locator, `${this.name} text content does not match expected "${expectedText}" using selector: ${this.selector}`).toHaveText(expectedText, { timeout });
        console.log(`${this.name} text content matches expected value: "${expectedText}"`);
    };

    shouldContainText = async (text: string | number, timeout = 2000) => {
        const expectedText = text.toString();
        console.log(`Verifying ${this.name} contains text: "${expectedText}"`);

        await expect(this.locator, `${this.name} text content does not contain expected text "${expectedText}" using selector: ${this.selector}`).toContainText(expectedText, { timeout });
        console.log(`${this.name} text content contains expected text: "${expectedText}"`);
    };

    shouldBeEnabled = async () => {
        console.log(`Verifying ${this.name} is enabled for user interaction`);
        await expect(this.locator, `${this.name} is disabled when it should be enabled for user interaction using selector: ${this.selector}`).toBeEnabled();
        console.log(`${this.name} is confirmed as enabled for user interaction`);
    };

    shouldBeDisabled = async () => {
        console.log(`Verifying ${this.name} is disabled from user interaction`);
        await expect(this.locator, `${this.name} is enabled when it should be disabled from user interaction using selector: ${this.selector}`).toBeDisabled();
        console.log(`${this.name} is confirmed as disabled from user interaction`);
    };

    isDisabled = async (): Promise<boolean> => {
        return await this.locator.isDisabled();
    };

    shouldHaveCount = async (count: number, timeout = 2000) => {
        console.log(`Verifying ${this.name} has exactly ${count} matching elements`);

        await expect(this.locator, `${this.name} element count does not match expected ${count} using selector: ${this.selector}`).toHaveCount(count, { timeout });
        console.log(`${this.name} element count matches expected value: ${count}`);
    };

    shouldBeSticky = async () => {
        console.log(`Verifying ${this.name} maintains sticky position during scroll`);

        const initialBox = await this.locator.boundingBox();
        expect(initialBox, `${this.name} is not visible to verify sticky position using selector: ${this.selector}`).toBeTruthy();

        // Scroll down and check position remains the same
        await this.page.evaluate(() => window.scrollTo(0, 500));
        await this.page.waitForTimeout(100); // Allow scroll to settle

        const scrolledBox = await this.locator.boundingBox();
        expect(scrolledBox, `${this.name} became invisible during scroll test when checking sticky position using selector: ${this.selector}`).toBeTruthy();

        expect(scrolledBox!.y, `${this.name} Y position changed from ${initialBox!.y}px to ${scrolledBox!.y}px during scroll instead of maintaining sticky position using selector: ${this.selector}`).toBe(initialBox!.y);

        console.log(`${this.name} successfully maintained sticky position during scroll`);
    };

    shouldBeSelected = async (timeout = 2000) => {
        console.log(`Verifying ${this.name} is in selected state`);

        await expect(this.locator, `${this.name} is not in selected state (aria-pressed attribute is not "true") using selector: ${this.selector}`).toHaveAttribute('aria-pressed', 'true', { timeout });
        console.log(`${this.name} is confirmed as selected (aria-pressed="true")`);
    };

    shouldNotBeSelected = async (timeout = 2000) => {
        console.log(`Verifying ${this.name} is not in selected state`);

        await expect(this.locator, `${this.name} is in selected state when it should be unselected (aria-pressed attribute is not "false") using selector: ${this.selector}`).toHaveAttribute('aria-pressed', 'false', { timeout });
        console.log(`${this.name} is confirmed as not selected (aria-pressed="false")`);
    };

    shouldHaveWidth = async (expectedWidth: number) => {
        console.log(`Verifying ${this.name} has width of ${expectedWidth}px`);

        const width = await this.locator.getAttribute('width');
        expect(width, `${this.name} does not have a width of ${expectedWidth}px using selector: ${this.selector}`).toEqual(expectedWidth.toString());
        console.log(`${this.name} is confirmed as having width of ${expectedWidth}px`);
    };

    shouldHaveHeight = async (expectedHeight: number) => {
        console.log(`Verifying ${this.name} has height of ${expectedHeight}px`);

        const height = await this.locator.getAttribute('height');
        expect(height, `${this.name} does not have a height of ${expectedHeight}px using selector: ${this.selector}`).toEqual(expectedHeight.toString());
        console.log(`${this.name} is confirmed as having height of ${expectedHeight}px`);
    };

    shouldHaveAspectRatio = async (expectedAspectRatio: number) => {
        console.log(`Verifying ${this.name} has aspect ratio of ${expectedAspectRatio}`);
        const aspect = Number(await this.locator.getAttribute('aspect-ratio'));
        expect(aspect, `${this.name} does not have an aspect ratio of ${expectedAspectRatio}`).toBeCloseTo(expectedAspectRatio, 3);
        console.log(`${this.name} is confirmed as having aspect ratio of ${expectedAspectRatio}`);
    };

    shouldHaveHref = async (expected: string) => {
        const actual = await this.locator.getAttribute('href');
        expect(actual, `${this.name} does not link to "${expected}"`).toEqual(expected);
    };

    shouldHavePlaceholder = async (expected: string) => {
        const actual = await this.locator.getAttribute('placeholder');
        expect(actual, `${this.name} does not have a placeholder of "${expected}"`).toEqual(expected);
    };

    shouldHaveValue = async (expected: string) => {
        const actual = await this.locator.getAttribute('value');
        expect(actual, `${this.name} does not have a value of "${expected}"`).toEqual(expected);
    };

    shouldHaveAttribute = async (key: string, value: string) => {
        const actual = await this.locator.getAttribute(key);
        expect(actual, `${this.name} has no attribute: "${key}"`).toBeTruthy();
        expect(actual, `${this.name} does not "${key}" equal to "${value}"`).toEqual(value);
        console.log(`${this.name} has "${key}" equal to "${value}"`);
    
    };

    shouldBeFullyVisible = async () => {
        expect(await this.locator.isVisible(), `${this.name} is not visible in the viewport`).toBe(true);

        const viewport = this.page.viewportSize();

        const box = await this.locator.boundingBox();

        if (!box || !viewport) {
            throw new Error(`Not possible to determine if ${this.name} is visible within the viewport`);
        }

        const isInViewport =
            box.x >= 0 &&
            box.x + box.width <= viewport.width &&
            box.y >= 0 &&
            box.y + box.height <= viewport.height;

        expect(isInViewport, `${this.name} is not fully visible in the viewport`).toBe(true);

        console.log(`${this.name} is fully visible within the viewport`);
    };
};