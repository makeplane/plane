# Mermaid.js Practical Examples

Real-world patterns and use cases for common documentation scenarios.

## Software Architecture

**Microservices Architecture:**
```mermaid
flowchart TB
  Client[Web Client]
  Gateway[API Gateway]
  Auth[Auth Service]
  User[User Service]
  Order[Order Service]
  Payment[Payment Service]
  DB1[(Users DB)]
  DB2[(Orders DB)]
  Cache[(Redis Cache)]

  Client --> Gateway
  Gateway --> Auth
  Gateway --> User
  Gateway --> Order
  User --> DB1
  Order --> DB2
  Order --> Payment
  User --> Cache
```

**System Components (C4):**
```mermaid
C4Context
  Person(customer, "Customer", "A user of the system")
  System(app, "Web Application", "Delivers content")
  System_Ext(email, "Email System", "Sends emails")

  Rel(customer, app, "Uses")
  Rel(app, email, "Sends via")
```

## API Documentation

**Authentication Flow:**
```mermaid
sequenceDiagram
  participant C as Client
  participant A as API
  participant D as Database

  C->>A: POST /auth/login
  activate A
  A->>D: Verify credentials
  D-->>A: User found
  A->>A: Generate JWT
  A-->>C: 200 OK + token
  deactivate A

  C->>A: GET /protected (Bearer token)
  activate A
  A->>A: Validate JWT
  A->>D: Fetch data
  D-->>A: Data
  A-->>C: 200 OK + data
  deactivate A
```

**REST API Endpoints:**
```mermaid
flowchart LR
  API[API]
  Users[/users]
  Posts[/posts]
  Comments[/comments]

  API --> Users
  API --> Posts
  API --> Comments

  Users --> U1[GET /users]
  Users --> U2[POST /users]
  Users --> U3[GET /users/:id]
  Users --> U4[PUT /users/:id]
  Users --> U5[DELETE /users/:id]
```

## Database Design

**E-Commerce Schema:**
```mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER {
    int id PK
    string email
    string name
  }
  ORDER ||--|{ LINE_ITEM : contains
  ORDER {
    int id PK
    int customer_id FK
    date created_at
    string status
  }
  PRODUCT ||--o{ LINE_ITEM : includes
  PRODUCT {
    int id PK
    string name
    decimal price
    int inventory
  }
  LINE_ITEM {
    int order_id FK
    int product_id FK
    int quantity
    decimal unit_price
  }
```

## State Machines

**Order Processing:**
```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Processing : payment_received
  Pending --> Cancelled : timeout
  Processing --> Shipped : items_packed
  Processing --> Failed : error
  Shipped --> Delivered : confirmed
  Delivered --> [*]
  Failed --> Refunded : refund_processed
  Cancelled --> [*]
  Refunded --> [*]
```

**User Authentication States:**
```mermaid
stateDiagram-v2
  [*] --> LoggedOut
  LoggedOut --> LoggingIn : submit_credentials
  LoggingIn --> LoggedIn : success
  LoggingIn --> LoggedOut : failure
  LoggedIn --> VerifyingMFA : requires_2fa
  VerifyingMFA --> LoggedIn : mfa_success
  VerifyingMFA --> LoggedOut : mfa_failure
  LoggedIn --> LoggedOut : logout
  LoggedIn --> [*]
```

## Project Planning

**Sprint Timeline:**
```mermaid
gantt
  title Sprint 12 (2 weeks)
  dateFormat YYYY-MM-DD
  section Backend
    API endpoints :done, api, 2024-01-01, 3d
    Database migration :active, db, after api, 2d
    Testing :test, after db, 2d
  section Frontend
    UI components :done, ui, 2024-01-01, 4d
    Integration :active, int, after ui, 3d
  section DevOps
    CI/CD setup :crit, cicd, 2024-01-06, 2d
    Deployment :milestone, deploy, after cicd, 1d
```

**Feature Development Journey:**
```mermaid
journey
  title Feature Implementation Journey
  section Planning
    Requirements gathering: 5: PM, Dev, Designer
    Tech design: 4: Dev, Architect
  section Development
    Backend API: 3: Dev
    Frontend UI: 4: Dev, Designer
    Testing: 5: QA, Dev
  section Deployment
    Code review: 4: Dev, Lead
    Production deploy: 5: DevOps, Dev
```

## Object-Oriented Design

**Payment System Classes:**
```mermaid
classDiagram
  class PaymentProcessor {
    <<interface>>
    +processPayment(amount)
    +refund(transactionId)
  }

  class StripeProcessor {
    -apiKey: string
    +processPayment(amount)
    +refund(transactionId)
  }

  class PayPalProcessor {
    -clientId: string
    -secret: string
    +processPayment(amount)
    +refund(transactionId)
  }

  class PaymentService {
    -processor: PaymentProcessor
    +charge(customer, amount)
    +issueRefund(orderId)
  }

  PaymentProcessor <|.. StripeProcessor
  PaymentProcessor <|.. PayPalProcessor
  PaymentService --> PaymentProcessor
```

## CI/CD Pipeline

**Deployment Flow:**
```mermaid
flowchart LR
  Code[Push Code] --> CI{CI Checks}
  CI -->|Pass| Build[Build]
  CI -->|Fail| Notify1[Notify Team]
  Build --> Test[Run Tests]
  Test -->|Pass| Stage[Deploy Staging]
  Test -->|Fail| Notify2[Notify Team]
  Stage --> Manual{Manual Approval}
  Manual -->|Approved| Prod[Deploy Production]
  Manual -->|Rejected| End1[End]
  Prod --> Monitor[Monitor]
  Monitor --> End2[End]
```

**Git Branching Strategy:**
```mermaid
gitGraph
  commit
  branch develop
  checkout develop
  commit
  branch feature/auth
  checkout feature/auth
  commit
  commit
  checkout develop
  merge feature/auth
  checkout main
  merge develop tag: "v1.0.0"
  checkout develop
  branch feature/payments
  checkout feature/payments
  commit
  checkout develop
  merge feature/payments
  checkout main
  merge develop tag: "v1.1.0"
```

## User Experience

**Customer Onboarding:**
```mermaid
journey
  title New Customer Onboarding
  section Discovery
    Visit website: 3: Customer
    Browse products: 4: Customer
  section Signup
    Create account: 2: Customer
    Email verification: 3: Customer, System
  section First Purchase
    Add to cart: 5: Customer
    Checkout: 4: Customer
    Payment: 3: Customer, Payment Gateway
  section Post-purchase
    Order confirmation: 5: Customer, System
    First delivery: 5: Customer, Delivery
```

## Cloud Infrastructure

**AWS Architecture:**
```mermaid
architecture-beta
  group vpc(cloud)[VPC]
  group public(cloud)[Public Subnet] in vpc
  group private(cloud)[Private Subnet] in vpc

  service lb(internet)[Load Balancer] in public
  service web(server)[Web Servers] in public
  service api(server)[API Servers] in private
  service db(database)[RDS Database] in private
  service cache(disk)[ElastiCache] in private

  lb:B --> T:web
  web:B --> T:api
  api:R --> L:db
  api:R --> L:cache
```

## Data Visualization

**Traffic Analysis:**
```mermaid
pie showData
  title Traffic Sources Q4 2024
  "Organic Search" : 45.5
  "Direct" : 25.3
  "Social Media" : 15.8
  "Referral" : 8.4
  "Paid Ads" : 5.0
```

**Team Skills Assessment:**
```mermaid
radar-beta
  axis Frontend, Backend, DevOps, Testing, Design
  curve Alice{5, 3, 2, 4, 2}
  curve Bob{3, 5, 4, 3, 1}
  curve Carol{4, 4, 5, 5, 3}
```

## Best Practices

**Naming Conventions:**
- Use descriptive node IDs: `userService` not `A`
- Clear labels: `[User Service]` not `[US]`
- Meaningful connections: `-->|authenticates|` not `-->`

**Styling Tips:**
```mermaid
%%{init: {'theme':'dark', 'themeVariables': {'primaryColor':'#ff6347'}}}%%
flowchart TD
  classDef important fill:#f96,stroke:#333,stroke-width:4px
  A[Critical Path]:::important
  B[Regular Task]
```

**Security:**
Use `securityLevel: 'strict'` to prevent XSS in user-generated diagrams.
