# Scenario Title Rules and Guidelines

The key to good scenario titles is to make them immediately understandable to anyone reading the requirements, they should clearly convey what business behavior is being described without requiring them to read the full scenario.

## Best Practices
### Use Consistent Terminology
    Pick one term and stick with it: "User" vs "Customer" vs "Member"
    Standardize action verbs: "Create" vs "Add" vs "Register"
    Use domain-specific language consistently

### Keep Titles Concise but Descriptive
    Aim for 3-8 words
    Include essential context
    Avoid unnecessary articles (a, an, the)

### Make Titles Scannable
    Use parallel structure within feature files
    Group related scenarios with similar title patterns
    Order from most common to least common scenarios

### Include Key Differentiators
    What makes this scenario unique?
    What specific condition or constraint applies?
    What outcome or behavior is being tested?

## Title Structure Patterns
### Actor + Action + Object Pattern
    "User creates new account"
    "Admin approves pending request"
    "Customer updates billing address"
    "System sends payment reminder"

### Action + Condition Pattern
    "Login with invalid credentials"
    "Registration with missing required fields"
    "Search with no matching results"
    "Payment processing during service outage"

### Process + State Pattern
    "Order processing with valid payment"
    "Document approval in draft state"
    "Account activation after verification"
    "Data backup during system maintenance"

### Capability + Constraint Pattern
    "File download with expired link"
    "User registration with duplicate email"
    "Meeting creation with conflicting time"
    "Report generation with insufficient permissions"

## Focus on Business Capability, Not Implementation
    Good:
        "User authentication with valid credentials"
        "Password reset via email"
        "Account lockout after failed attempts"
        "Order cancellation before shipment"

    Poor:
        "POST request to /api/login endpoint"
        "Database query returns user record"
        "Session token generation"
        "Email service sends notification"

## Use Active Voice and Clear Actions
    Good:
        "User updates profile information"
        "System validates payment details"
        "Administrator deactivates user account"
        "Customer cancels subscription"

    Poor:
        "Profile information is updated"
        "Payment details get validated"
        "User account deactivation"
        "Subscription cancellation process"

## Be Specific About the Outcome or Condition
    Good:
        "Registration with duplicate email address"
        "Login attempt with expired session"
        "File upload exceeding size limit"
        "Purchase with insufficient funds"

    Poor:
        "Registration error"
        "Login failure"
        "File upload problem"
        "Purchase issue"

## Include the Context When Relevant
    Good:
        "Guest user attempts to access protected content"
        "Admin user deletes another user's post"
        "Mobile app synchronizes data while offline"
        "Subscription renewal during maintenance window"

    Poor:
        "Access denied"
        "Post deletion"
        "Data sync"
        "Renewal failure"

## Good Title Examples by Category
### Authentication & Authorization
    "User login with valid credentials"
    "Password reset with unregistered email"
    "Account lockout after multiple failed attempts"
    "Access denied for insufficient permissions"
    "Session timeout during active usage"

### Data Validation
    "Form submission with invalid email format"
    "Input validation with missing required fields"
    "File upload with unsupported format"
    "Data entry exceeding character limits"
    "Number input outside acceptable range"

### Business Workflow
    "Order placement with valid payment method"
    "Document approval by authorized reviewer"
    "Subscription cancellation before billing cycle"
    "Report generation with filtered criteria"
    "Notification delivery to offline user"

### Error Handling
    "Service recovery after temporary outage"
    "Data processing with corrupted input"
    "Network timeout during file transfer"
    "Resource unavailable during peak usage"
    "External API failure during integration"

### Integration & External Systems
    "Payment processing with third-party gateway"
    "Data synchronization with external database"
    "Email delivery through notification service"
    "Authentication via social media provider"
    "Report export to external system"

## Poor Title Examples by Category (Anti-Patterns)
### Vague or Generic Titles
    "Happy path"
    "Error case"
    "Basic functionality"
    "Standard process"
    "Normal operation"

### Implementation-Focused Titles
    "API endpoint validation"
    "Database transaction rollback"
    "Cache invalidation process"
    "Message queue processing"
    "Load balancer configuration"

### Test-Focused Rather Than Behavior-Focused
    "Test login functionality"
    "Verify error handling"
    "Check validation rules"
    "Validate user input"
    "Test edge cases"

### Overly Long or Complex Titles
    "User attempts to register account with invalid email while system is under heavy load during peak hours"
    "Administrator user with elevated privileges tries to delete another user's post that was created yesterday"

### Titles That Don't Match Content
    Title: "User login" (but scenario tests password complexity)
    Title: "Data validation" (but scenario tests network timeout)
    Title: "System performance" (but scenario tests user permissions)




