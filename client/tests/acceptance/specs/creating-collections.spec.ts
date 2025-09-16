import { test, expect, Page } from '@playwright/test';
import { ImageVault } from '../../ui-model/image-vault';
import { Collection } from '@/domain';


async function pauseRoute(page: Page, urlPattern: string | RegExp, method?: string) {
    let resume: () => void;
    const ready = new Promise<void>(resolve => { resume = resolve; });
    
    await page.route(urlPattern, async route => {
        if (!method || route.request().method() === method) {
            await ready;
            await route.continue();
        } else {
            await route.continue();
        }
    });
    
    return resume!;
}

test.describe('Client - Home Page - Creating Collections', () => {

    test.beforeEach(async () => {
        Collection.clear();
    });

    test('User views the Collection creation form', async ({ page }) => {
        const ui = new ImageVault(page);

        // When the the user visits the home page
        await ui.homePage.visit();

        // Then the Collection creation form is displayed as the last card in the Collection list
        await ui.homePage.creationForm.shouldBeDisplayed();

        // And the input field shows placeholder text "Add a new Collection..."
        await ui.homePage.creationForm.nameInput.shouldHavePlaceholder('Add a new Collection...');
        await ui.homePage.creationForm.nameInput.shouldHaveValue('');

        // And the Submit button text is displayed as "Create"
        await ui.homePage.creationForm.submitButton.shouldHaveText('Create');

        // Verify no errors occurred during the interaction
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User attempts creation with a valid Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();

        const continueRequest = await pauseRoute(page, '/api/collections', 'POST');

        // Given the user has entered a valid Collection name
        await ui.homePage.creationForm.nameInput.type('my-new-collection');

        // When the user submits the form
        await ui.homePage.creationForm.submitButton.click();

        // Then the loading spinner is displayed in the submit button
        // And the Submit button text is no longer displayed
        // And no validation errors are displayed
        await ui.homePage.creationForm.loadingSpinner.shouldBeDisplayed();
        await ui.homePage.creationForm.submitButton.shouldHaveText('');
        await ui.homePage.userMessage.shouldHaveText('');

        // Allow the request to continue
        continueRequest();

        // Verify no console errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });

    test('The creation request succeeds', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();

        // Given the creation form has been submitted
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/api/collections') &&
            response.request().method() === 'POST' &&
            response.status() === 201
        );

        await ui.homePage.creationForm.nameInput.type('successful-collection');
        await ui.homePage.creationForm.submitButton.click();

        // When the network request is successful
        await responsePromise;

        // Then the new Collection appears in the Collections list
        await ui.homePage.collectionCard('successful-collection').shouldBeDisplayed();
        await ui.homePage.collectionCard('successful-collection').title.shouldHaveText('successful-collection');

        // And the loading spinner is no longer displayed
        // And the Submit button text is displayed as "Create"
        // And the input field shows placeholder text "Add a new Collection..."
         // And no validation errors are displayed
        await ui.homePage.creationForm.loadingSpinner.shouldNotBeDisplayed();
        await ui.homePage.creationForm.submitButton.shouldHaveText('Create');
        await ui.homePage.creationForm.nameInput.shouldHavePlaceholder('Add a new Collection...');
        await ui.homePage.creationForm.nameInput.shouldHaveValue('');
        await ui.homePage.userMessage.shouldHaveText('');
        
        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('The creation request fails', async ({ page }) => {
        const ui = new ImageVault(page);

        // Simulate a server error
        await page.setExtraHTTPHeaders({
            'X-Test-Force-Server-Error': 'true'
        });

        await ui.homePage.visit();

        // Given the creation form has been submitted
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/api/collections') &&
            response.request().method() === 'POST' &&
            response.status() >= 400
        );

        await ui.homePage.creationForm.nameInput.type('failed-collection');

        // When the network request fails
        await responsePromise;

        // Then the new Collection does not appear in the Collections list
        await ui.homePage.collectionCard().shouldHaveCount(0);

        // And the loading spinner is no longer displayed
        await ui.homePage.creationForm.loadingSpinner.shouldNotBeDisplayed();
    
         // And the Submit button text is displayed as "Create"
        await ui.homePage.creationForm.submitButton.shouldHaveText('Create');

        // And the input field shows placeholder text "Add a new Collection..."
        await ui.homePage.creationForm.nameInput.shouldHavePlaceholder('Add a new Collection...');
        await ui.homePage.creationForm.nameInput.shouldHaveValue('');
    
        // And the the response error message is displayed
        await ui.homePage.userMessage.shouldHaveText('An error occurred whilst creating the Collection')

        // Verify no console errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });

    test('User attempts to create a Collection with a duplicate name', async ({ page }) => {
        // Create an existing collection
        Collection.create('existing-collection');

        const ui = new ImageVault(page);
        await ui.homePage.visit();

        // Given the user has entered a valid Collection name
        // But a Collection with that name already exists
        await ui.homePage.creationForm.nameInput.type('existing-collection');

        // When the user attempts to submit the form
        await ui.homePage.creationForm.submitButton.click();

        // Then the validation message "A Collection with that name already exists" is displayed
        await ui.homePage.userMessage.shouldHaveText('A Collection with that name already exists');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
        await ui.shouldHaveNoFailedRequests();
    });

    test('User attempts creation with an empty Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();

        const requestCountBefore = (await ui.getRequestsForUrl('/api/collections')).length

        // Given the user has not entered a Collection name (input is empty by default)

        // When the user attempts to submit the form
        await ui.homePage.creationForm.submitButton.click();

        const requestCountAfter = (await ui.getRequestsForUrl('/api/collections')).length

        expect(requestCountAfter, 'Additional requests should not have been made, request count after submission should be the same as before').toEqual(requestCountBefore);

        // And the validation message "Collection name is required" is displayed
        await ui.homePage.userMessage.shouldHaveText('Collection name is required');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });

    test('User attempts creation with an invalid Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();

        const requestCountBefore = (await ui.getRequestsForUrl('/api/collections')).length

        // Given the user has entered an invalid Collection name
        await ui.homePage.creationForm.nameInput.type('invalid@collection!name');

        // When the user attempts to submit the form
        await ui.homePage.creationForm.submitButton.click();

        const requestCountAfter = (await ui.getRequestsForUrl('/api/collections')).length

        expect(requestCountAfter, 'Additional requests should not have been made, request count after submission should be the same as before').toEqual(requestCountBefore);

        // And the validation message "Collection names may only contain letters, numbers, underscores and hyphens" is displayed
        await ui.homePage.userMessage.shouldHaveText('Collection names may only contain letters, numbers, underscores and hyphens');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });

    test('User attempts creation with a Collection name that is too long', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();

        const requestCountBefore = (await ui.getRequestsForUrl('/api/collections')).length

        // Given the user has entered a collection name that is too long
        const longName = 'a'.repeat(257);
        await ui.homePage.creationForm.nameInput.type(longName);

        // When the user attempts to submit the form
        await ui.homePage.creationForm.submitButton.click();

        const requestCountAfter = (await ui.getRequestsForUrl('/api/collections')).length

        expect(requestCountAfter, 'Additional requests should not have been made, request count after submission should be the same as before').toEqual(requestCountBefore);

        // And the validation message "Collection name must be 256 characters or less" is displayed
        await ui.homePage.userMessage.shouldHaveText('Collection name must be 256 characters or less');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });

    test('User updates an invalid Collection name', async ({ page }) => {
        const ui = new ImageVault(page);
        await ui.homePage.visit();

        // Given the user has triggered a validation error
        await ui.homePage.creationForm.nameInput.type('invalid@name');
        await ui.homePage.creationForm.submitButton.click();
        await ui.homePage.userMessage.shouldHaveText('Collection names may only contain letters, numbers, underscores and hyphens');

        // When they interact with the input
        await ui.homePage.creationForm.nameInput.click();

        // Then the validation message is no longer displayed
        await ui.homePage.userMessage.shouldHaveText('');

        // Verify no errors occurred
        await ui.shouldHaveNoConsoleErrors();
    });
});