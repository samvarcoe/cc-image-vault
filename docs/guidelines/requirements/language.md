# Language Guidelines

Language consistency is crucial for clear, unambiguous requirements. Here are detailed guidelines with examples:
Active Voice Guidelines
Use Active Voice (Subject performs action)
Good:

"The system validates the user's credentials"
"The user clicks the submit button"
"The database stores the transaction record"

Poor (Passive Voice):

"The user's credentials are validated"
"The submit button is clicked"
"The transaction record is stored"

Why Active Voice Matters

Clarity: Makes it clear who/what performs the action
Accountability: Identifies the responsible component
Testability: Easier to verify who should do what

Specific Verbs Guidelines
Use Precise, Measurable Verbs
Good:

"displays" instead of "shows"
"validates" instead of "checks"
"calculates" instead of "figures out"
"redirects" instead of "goes to"
"stores" instead of "saves"

Poor (Vague Verbs):

"handles" → too generic
"processes" → unclear what processing means
"manages" → ambiguous action
"deals with" → unprofessional and vague

Scenario-Specific Examples
Authentication Feature
Good:
Given the user enters valid credentials
When the system validates the username and password
Then the system grants access to the dashboard
And the system logs the successful login attempt
Poor:
Given valid credentials are entered
When the system checks the login
Then access is given
And the login is handled
Data Validation Feature
Good:
Given the user submits a form with invalid email format
When the system validates the email field
Then the system displays "Invalid email format" error message
And the system highlights the email field in red
Poor:
Given invalid email is provided
When validation happens
Then an error shows
And the field is marked
Consistency Rules
1. Standardize Domain Language
System Actions:

validates, authenticates, authorizes
calculates, computes, processes
stores, retrieves, updates, deletes
displays, renders, shows
redirects, navigates, routes

User Actions:

enters, inputs, types
clicks, selects, chooses
submits, confirms, cancels
uploads, downloads, saves

2. Use Consistent Terminology
Good (Consistent):
Scenario: User registration
    Given the user enters registration details
    When the user clicks the register button
    Then the system creates a new user account

Scenario: User login
    Given the user enters login credentials
    When the user clicks the login button
    Then the system authenticates the user
Poor (Inconsistent):
Scenario: User registration
    Given the user provides registration info
    When the user hits the register button
    Then the system makes a new user account

Scenario: User login
    Given the user inputs login details
    When the user presses the login button
    Then the system checks the user
3. Avoid Ambiguous Language
Good (Specific):

"The system displays a confirmation message"
"The user receives an email notification within 5 minutes"
"The form validates all required fields"

Poor (Ambiguous):

"The system responds appropriately"
"The user gets notified"
"The form works correctly"

Recommended Verb Categories
System Behaviors

Validation: validates, verifies, confirms, checks
Data Operations: stores, retrieves, updates, deletes, creates
Display: displays, renders, shows, presents, highlights
Navigation: redirects, navigates, routes, forwards
Communication: sends, receives, transmits, notifies

User Actions

Input: enters, types, inputs, provides, submits
Selection: clicks, selects, chooses, picks, toggles
Navigation: navigates, visits, accesses, opens, closes
File Operations: uploads, downloads, saves, deletes, shares

State Changes

Activation: enables, activates, turns on, starts
Deactivation: disables, deactivates, turns off, stops
Status: becomes, changes to, transitions to, sets to

Common Mistakes to Avoid
1. Mixing Tenses
Good:
Given the user is logged in
When the user clicks logout
Then the system logs out the user
Poor:
Given the user was logged in
When the user will click logout
Then the system would log out the user
2. Using Modal Verbs Unnecessarily
Good:
When the user enters invalid data
Then the system displays an error message
Poor:
When the user enters invalid data
Then the system should display an error message
3. Anthropomorphizing Systems
Good:
Then the system calculates the total price
Poor:
Then the system thinks about the total price
Then the system decides the total price
These guidelines ensure your requirements are clear, testable, and consistent across your entire documentation set.