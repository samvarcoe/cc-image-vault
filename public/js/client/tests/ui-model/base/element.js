import { expect } from '@playwright/test';
export class Element {
    constructor(name, selector, page) {
        this.name = name;
        this.selector = selector;
        this.page = page;
        this.deriveInstance = (name, selector) => {
            return new this.constructor(name, selector, this.page);
        };
        this.child = (E, name, selector) => {
            const combinedSelector = `${this.selector} ${selector}`;
            return new E(`${this.name} > ${name}`, combinedSelector, this.page);
        };
        this.byIndex = (index) => {
            const indexSelector = `${this.selector} >> nth=${index}`;
            return this.deriveInstance(`${this.name}[${index}]`, indexSelector);
        };
        this.byText = (text) => {
            const textSelector = `${this.selector} >> text="${text}"`;
            return this.deriveInstance(`${this.name}[${text}]`, textSelector);
        };
        this.exists = async () => {
            try {
                await this.locator.waitFor({ state: 'attached', timeout: 1000 });
                return true;
            }
            catch (_a) {
                return false;
            }
        };
        this.displayed = async () => {
            try {
                await this.locator.waitFor({ state: 'visible', timeout: 1000 });
                return true;
            }
            catch (_a) {
                return false;
            }
        };
        this.count = async () => {
            return await this.locator.count();
        };
        this.scrollInToView = async () => {
            LOGGER.log(`Scrolling the ${this.name} element in to view`);
            await this.locator.scrollIntoViewIfNeeded();
        };
        this.click = async () => {
            LOGGER.log(`Clicking the ${this.name} element`);
            await this.locator.scrollIntoViewIfNeeded();
            await this.locator.click();
        };
        this.type = async (text, sensitive = false) => {
            LOGGER.log(`Typing "${sensitive ? '*******' : text}" in to ${this.name}`);
            await this.locator.fill(text);
        };
        this.setInputFiles = async (files) => {
            LOGGER.log(`Setting ${files.length} files on ${this.name}`);
            await this.locator.setInputFiles(files);
        };
        this.shouldBeDisplayed = async () => {
            LOGGER.log(`Verifying ${this.name} is visible on the page`);
            await expect(this.locator, `${this.name} is not visible on the page using selector: ${this.selector}`).toBeVisible();
            LOGGER.log(`${this.name} is confirmed as visible on the page`);
        };
        this.shouldNotBeDisplayed = async () => {
            LOGGER.log(`Verifying ${this.name} is not visible on the page`);
            await expect(this.locator, `${this.name} is visible on the page when it should be hidden using selector: ${this.selector}`).not.toBeVisible();
            LOGGER.log(`${this.name} is confirmed as not visible on the page`);
        };
        this.shouldNotExist = async (timeout = 2000) => {
            LOGGER.log(`Verifying ${this.name} does not exist in the DOM`);
            await expect(this.locator, `${this.name} exists in the DOM when it should be removed after ${timeout}ms timeout using selector: ${this.selector}`).not.toBeAttached({ timeout });
            LOGGER.log(`${this.name} is confirmed as not existing in the DOM`);
        };
        this.shouldHaveText = async (text, timeout = 2000) => {
            const expectedText = text.toString();
            LOGGER.log(`Verifying ${this.name} has exact text: "${expectedText}"`);
            await expect(this.locator, `${this.name} text content does not match expected "${expectedText}" using selector: ${this.selector}`).toHaveText(expectedText, { timeout });
            LOGGER.log(`${this.name} text content matches expected value: "${expectedText}"`);
        };
        this.shouldContainText = async (text, timeout = 2000) => {
            const expectedText = text.toString();
            LOGGER.log(`Verifying ${this.name} contains text: "${expectedText}"`);
            await expect(this.locator, `${this.name} text content does not contain expected text "${expectedText}" using selector: ${this.selector}`).toContainText(expectedText, { timeout });
            LOGGER.log(`${this.name} text content contains expected text: "${expectedText}"`);
        };
        this.shouldBeEnabled = async () => {
            LOGGER.log(`Verifying ${this.name} is enabled for user interaction`);
            await expect(this.locator, `${this.name} is disabled when it should be enabled for user interaction using selector: ${this.selector}`).toBeEnabled();
            LOGGER.log(`${this.name} is confirmed as enabled for user interaction`);
        };
        this.shouldBeDisabled = async () => {
            LOGGER.log(`Verifying ${this.name} is disabled from user interaction`);
            await expect(this.locator, `${this.name} is enabled when it should be disabled from user interaction using selector: ${this.selector}`).toBeDisabled();
            LOGGER.log(`${this.name} is confirmed as disabled from user interaction`);
        };
        this.isDisabled = async () => {
            return await this.locator.isDisabled();
        };
        this.shouldHaveCount = async (count, timeout = 2000) => {
            LOGGER.log(`Verifying ${this.name} has exactly ${count} matching elements`);
            await expect(this.locator, `${this.name} element count does not match expected ${count} using selector: ${this.selector}`).toHaveCount(count, { timeout });
            LOGGER.log(`${this.name} element count matches expected value: ${count}`);
        };
        this.shouldBeSticky = async () => {
            LOGGER.log(`Verifying ${this.name} maintains sticky position during scroll`);
            const initialBox = await this.locator.boundingBox();
            expect(initialBox, `${this.name} is not visible to verify sticky position using selector: ${this.selector}`).toBeTruthy();
            await this.page.evaluate(() => window.scrollTo(0, 500));
            await this.page.waitForTimeout(100);
            const scrolledBox = await this.locator.boundingBox();
            expect(scrolledBox, `${this.name} became invisible during scroll test when checking sticky position using selector: ${this.selector}`).toBeTruthy();
            expect(scrolledBox.y, `${this.name} Y position changed from ${initialBox.y}px to ${scrolledBox.y}px during scroll instead of maintaining sticky position using selector: ${this.selector}`).toBe(initialBox.y);
            LOGGER.log(`${this.name} successfully maintained sticky position during scroll`);
        };
        this.shouldBePressed = async (timeout = 2000) => {
            LOGGER.log(`Verifying ${this.name} is in pressed state`);
            await expect(this.locator, `${this.name} is not in pressed state using selector: ${this.selector}`).toHaveAttribute('aria-pressed', 'true', { timeout });
            LOGGER.log(`${this.name} is pressed`);
        };
        this.shouldNotBePressed = async (timeout = 2000) => {
            LOGGER.log(`Verifying ${this.name} is not in pressed state`);
            await expect(this.locator, `${this.name} is in pressed state when it should be unpressed using selector: ${this.selector}`).toHaveAttribute('aria-pressed', 'false', { timeout });
            LOGGER.log(`${this.name} is not pressed`);
        };
        this.shouldBeSelected = async () => {
            await expect(this.locator, `${this.name} should be selected but data-selected is not "true"`).toHaveAttribute('data-selected', 'true');
            LOGGER.log(`✓ ${this.name} is selected`);
        };
        this.shouldNotBeSelected = async () => {
            await expect(this.locator, `${this.name} should not be selected but data-selected is "true"`).not.toHaveAttribute('data-selected', 'true');
            LOGGER.log(`✓ ${this.name} is not selected`);
        };
        this.shouldHaveWidth = async (expectedWidth) => {
            LOGGER.log(`Verifying ${this.name} has width of ${expectedWidth}px`);
            const width = await this.locator.getAttribute('width');
            expect(width, `${this.name} does not have a width of ${expectedWidth}px using selector: ${this.selector}`).toEqual(expectedWidth.toString());
            LOGGER.log(`${this.name} is confirmed as having width of ${expectedWidth}px`);
        };
        this.shouldHaveHeight = async (expectedHeight) => {
            LOGGER.log(`Verifying ${this.name} has height of ${expectedHeight}px`);
            const height = await this.locator.getAttribute('height');
            expect(height, `${this.name} does not have a height of ${expectedHeight}px using selector: ${this.selector}`).toEqual(expectedHeight.toString());
            LOGGER.log(`${this.name} is confirmed as having height of ${expectedHeight}px`);
        };
        this.shouldHaveAspectRatio = async (expectedAspectRatio) => {
            LOGGER.log(`Verifying ${this.name} has aspect ratio of ${expectedAspectRatio}`);
            const aspect = Number(await this.locator.getAttribute('aspect-ratio'));
            expect(aspect, `${this.name} does not have an aspect ratio of ${expectedAspectRatio}`).toBeCloseTo(expectedAspectRatio, 3);
            LOGGER.log(`${this.name} is confirmed as having aspect ratio of ${expectedAspectRatio}`);
        };
        this.shouldHaveHref = async (expected) => {
            const actual = await this.locator.getAttribute('href');
            expect(actual, `${this.name} does not link to "${expected}"`).toEqual(expected);
        };
        this.shouldHavePlaceholder = async (expected) => {
            const actual = await this.locator.getAttribute('placeholder');
            expect(actual, `${this.name} does not have a placeholder of "${expected}"`).toEqual(expected);
        };
        this.shouldHaveValue = async (expected) => {
            const actual = await this.locator.getAttribute('value');
            expect(actual, `${this.name} does not have a value of "${expected}"`).toEqual(expected);
        };
        this.getAttribute = async (key) => {
            return await this.locator.getAttribute(key);
        };
        this.shouldHaveAttribute = async (key, value) => {
            const actual = await this.locator.getAttribute(key);
            expect(actual, `${this.name} has no attribute: "${key}"`).not.toBeNull();
            expect(actual, `${this.name} does not "${key}" equal to "${value}"`).toEqual(value);
            LOGGER.log(`${this.name} has "${key}" equal to "${value}"`);
        };
        this.shouldBeFullyVisible = async () => {
            expect(await this.locator.isVisible(), `${this.name} is not visible in the viewport`).toBe(true);
            const viewport = this.page.viewportSize();
            const box = await this.locator.boundingBox();
            if (!box || !viewport) {
                throw new Error(`Not possible to determine if ${this.name} is visible within the viewport`);
            }
            const isInViewport = box.x >= 0 &&
                box.x + box.width <= viewport.width &&
                box.y >= 0 &&
                box.y + box.height <= viewport.height;
            expect(isInViewport, `${this.name} is not fully visible in the viewport`).toBe(true);
            LOGGER.log(`${this.name} is fully visible within the viewport`);
        };
        this.locator = this.page.locator(this.selector);
    }
}
;
