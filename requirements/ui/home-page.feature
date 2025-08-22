Feature: Home Page
    As a user, I want to view and manage my collections from a home page, so that I can easily access and organize my image collections.

    Scenario: Collections exist in the system
        Given multiple collections exist in the system
        When the user views the collections list
        Then all of the collections are displayed in alphabetical order
        And the collections link to their respective collection pages

    Scenario: No collections exist in the system
        Given no collections exist in the system  
        When the user views the collections list
        Then the empty state message is displayed
        And the system provides the option to create first collection

    Scenario: User creates their first collection
        Given no collections exist in the system 
        When the user attempts to create a new collection with a valid collection ID
        Then the system creates a new collection
        And collection list on the homepage is updated

    Scenario: User creates an additional collection
        Given multiple collections exist in the system
        When the user attempts to create a new collection with a valid collection ID
        Then the system creates a new collection
        And collection list on the homepage is updated

    Scenario: User attempts to create a collection with an invalid ID
        Given the user is attempting to create a new collection
        When the user enters a collection ID with invalid characters
        Then the system immediately displays a validation error message
        And the user is prevented from submitting the request

    Scenario: Collection creation with duplicate ID  
        Given the user is on the home page
        And a collection already exists with the target ID
        When the user attempts to create collection with duplicate ID
        Then the system displays duplicate ID error message
        And the system prevents collection creation

    Scenario: User attempts to delete a collection
        Given a collection exists in the system
        When the user attempts to delete it
        Then a dialog is shown with the collection ID and a warning message

    Scenario: User confirms deletion of a collection
        Given the deletion warning is displayed
        When the user confirms the deletion
        Then the collection is deleted
        And the collection is removed from the collections list

    Scenario: User cancels deletion of a collection
        Given the deletion warning is displayed 
        When the user cancels the deletion
        Then the collection is not deleted
        And the collection remains in the collections list