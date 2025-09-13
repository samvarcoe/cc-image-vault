Feature: Client - Home Page - Viewing Collections
    User Story: As a user, I want to view my collections on the home page, so that I can see what collections are available and navigate to them

    Acceptance Criteria:
      - AC1: Existing collections are displayed in a card-based list showing their names
      - AC2: Each collection card links to the collection's main page
      - AC3: A helpful message is displayed when there are no collections
      - AC4: A generic error message is displayed when there is an error loading collections

    Notes:
      - Collections are displayed as the only content on the home page
      - Card layout allows for future extension with additional buttons (delete, etc.)
      - Navigation follows the established routing pattern to /collection/:id

    Scenario: User visits home page and collections exist
        Given there are some collections in the system
        When the user visits the home page
        Then the page displays collections in a card-based layout
        And each collection card shows the collection name
        And each collection card links to the collection's main page

    Scenario: User visits home page and no collections exist
        Given there are no collections in the system
        When the user visits the home page
        Then the page displays the message "No Collections found, create one to get started"

    Scenario: Error occurs when loading collections on home page
        Given the user visits the home page
        When there is an error retrieving the collections list
        Then the page displays the message "Unable to load collections"