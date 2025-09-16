Feature: Client - Home Page - Creating Collections
    User Story: As a user, I want to create new Collections from the home page, so that I can start organizing my images

    Acceptance Criteria:
      - AC1: Collection creation form is displayed inline as the last item in the collection list
      - AC2: Client-side validation mirrors API validation rules 
      - AC3: Client-side validation is performed on submit 
      - AC4: Loading indicator appears in the submit button during creation
      - AC5: Successful creation adds the new collection to the list without page refresh
      - AC6: Validation errors are displayed in the user message element below the input field
      - AC7: Network errors are displayed in the user message element
      - AC8: Form remains accessible for creating additional Collections after success

    Notes:
      - The creation form is always visible at the bottom of the collection list
      - Validation rules: non-empty, max 256 characters, alphanumeric with hyphens/underscores
      - No cancel functionality - users can simply clear the input to reset
      - The form input clears after successful creation
      - Loading state prevents multiple submissions of the same collection

    Scenario: User views the Collection creation form
        When the the user visits the home page
        Then the Collection creation form is displayed as the last card in the Collection list
        And the input field shows placeholder text "Add a new Collection..."
        And the Submit button text is displayed as "Create"

    Scenario: User attempts creation with a valid Collection name
        Given the user has entered a valid Collection name
        When the user submits the form
        Then the loading spinner is displayed in the submit button
        And the Submit button text is no longer displayed
        And no validation errors are displayed

    Scenario: The creation request succeeds
        Given the creation form has been submitted
        When the network request is successful
        Then the new Collection appears in the Collections list
        And the loading spinner is no longer displayed 
        And the input field shows placeholder text "Add a new Collection..."
        And the Submit button text is displayed as "Create"
        And no validation errors are displayed

    Scenario: The creation request fails
        Given the creation form has been submitted
        When the network request fails
        Then the new Collection does not appear in the Collections list
        And the loading spinner is no longer displayed 
        And the input field shows placeholder text "Add a new Collection..."
        And the Submit button text is displayed as "Create"
        And the the response error message is displayed

    Scenario: User attempts to create a Collection with a duplicate name
        Given the user has entered a valid Collection name
        But a Collection with that name already exists
        When the user attempts to submit the form
        Then the validation message "A Collection with that name already exists" is displayed 

    Scenario: User attempts creation with an empty Collection name
        Given the user has not entered a Collection name
        When the user attempts to submit the form
        Then no request is made
        And the validation message "Collection name is required" is displayed

    Scenario: User attempts creation with an invalid Collection name
        Given the user has entered an invalid Collection name
        When the user attempts to submit the form
        Then no request is made
        And the validation message "Collection names may only contain letters, numbers, underscores and hyphens" is displayed

    Scenario: User attempts creation with a Collection name that is too long
        Given the user has entered a collection name that is too long
        When the user attempts to submit the form
        Then no request is made
        And the validation message "Collection name must be 256 characters or less" is displayed

    Scenario: User updates an invalid Collection name
        Given the user has triggered a validation error
        When they interact with the input
        Then the validation message is no longer displayed