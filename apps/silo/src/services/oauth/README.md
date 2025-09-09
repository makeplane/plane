# OAuth Service Module

This module provides a flexible and extensible OAuth integration system for the Plane application. It uses the Strategy pattern to handle different OAuth providers (GitHub, GitLab, Slack, etc.) in a consistent way while allowing provider-specific implementations.

## Architecture

The module consists of several key components:

### Core Components

- `OAuthStrategy`: Interface defining the contract for all OAuth providers
- `OAuthController`: Handles common workspace operations and coordinates with strategies
- `OAuthRoutes`: Exposes RESTful endpoints for OAuth operations
- `OAuthStrategyManager`: Manages registration and retrieval of OAuth strategies
- `registerOAuthStrategies`: Centralized function for registering all OAuth strategies

### Directory Structure

```
services/oauth/
├── strategies/          # Provider-specific implementations
│   ├── github.ts
│   ├── gitlab.ts
│   └── slack.ts
├── controller.ts        # Common workspace operations
├── routes.ts           # HTTP endpoints
├── strategy-manager.ts  # Strategy registration and management
├── types.ts            # Common interfaces and types
├── index.ts            # Main entry point and strategy registration
└── README.md           # This file
```

## Strategy Registration

Strategies are registered centrally through the `registerOAuthStrategies` function in `index.ts`. This function is called during server initialization:

```typescript
// In index.ts
export function registerOAuthStrategies() {
  const strategyManager = OAuthStrategyManager.getInstance();

  // Register GitHub strategy if environment variables are present
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    strategyManager.registerStrategy(E_INTEGRATION_KEYS.GITHUB, new GithubOAuthStrategy());
  }

  // Add more strategy registrations here
}
```

The registration function is called in the Server class during initialization:

```typescript
constructor() {
  // ... other initialization code ...
  registerOAuthStrategies();
}
```

## Implementing a New OAuth Provider

To add support for a new OAuth provider, follow these steps:

1. Create a new strategy file in `strategies/` directory:

2. Register the strategy in `index.ts`:

```typescript
export function registerOAuthStrategies() {
  const strategyManager = OAuthStrategyManager.getInstance();

  // Register new provider strategy if environment variables are present
  if (env.NEW_PROVIDER_CLIENT_ID && env.NEW_PROVIDER_CLIENT_SECRET) {
    strategyManager.registerStrategy(
      E_INTEGRATION_KEYS.NEW_PROVIDER,
      new NewProviderOAuthStrategy({
        clientId: env.NEW_PROVIDER_CLIENT_ID,
        clientSecret: env.NEW_PROVIDER_CLIENT_SECRET,
        redirectUri: encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/oauth/new-provider/auth/callback"),
      })
    );
  }
}
```

3. Add provider-specific environment variables:

```env
NEW_PROVIDER_CLIENT_ID=your_client_id
NEW_PROVIDER_CLIENT_SECRET=your_client_secret
```

## Available Endpoints

The module exposes the following RESTful endpoints for each provider:

```
GET    /api/oauth/:provider/auth/organization-status/:workspaceId
POST   /api/oauth/:provider/auth/organization-disconnect/:workspaceId/:connectionId/:userId
POST   /api/oauth/:provider/auth/url
GET    /api/oauth/:provider/auth/callback
GET    /api/oauth/:provider/auth/user-status/:workspaceId/:userId
POST   /api/oauth/:provider/auth/user-disconnect/:workspaceId/:userId

```

Where `:provider` can be any registered OAuth provider (github, gitlab, slack, etc.).

## Best Practices

1. **Error Handling**: Always implement proper error handling in your strategy:
   - Validate all incoming data
   - Handle API errors gracefully
   - Provide meaningful error messages

2. **Type Safety**: Use TypeScript interfaces for all provider-specific types:
   - Define interfaces for API responses
   - Use proper type guards
   - Avoid using `any` type where possible

3. **Security**: Follow OAuth security best practices:
   - Always validate webhook signatures
   - Use state parameter to prevent CSRF
   - Never expose sensitive credentials

4. **Testing**: Write tests for your strategy:
   - Unit tests for token handling
   - Integration tests for API calls
   - Mock external service calls

## Common Operations

The `OAuthController` handles common operations like:

- Managing workspace credentials
- Creating/updating workspace connections
- Handling connection status
- Managing user connections
- Coordinating webhook processing

Your strategy should focus only on OAuth-specific operations and delegate workspace management to the controller.
