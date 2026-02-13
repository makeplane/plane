# OAuth Providers

Better Auth provides built-in OAuth 2.0 support for social authentication. No plugins required.

## Supported Providers

GitHub, Google, Apple, Discord, Facebook, Microsoft, Twitter/X, Spotify, Twitch, LinkedIn, Dropbox, GitLab, and more.

## Basic OAuth Setup

### Server Configuration

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Optional: custom scopes
      scope: ["user:email", "read:user"]
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["openid", "email", "profile"]
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }
  }
});
```

### Client Usage

```ts
import { authClient } from "@/lib/auth-client";

// Basic sign in
await authClient.signIn.social({
  provider: "github",
  callbackURL: "/dashboard"
});

// With callbacks
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
  errorCallbackURL: "/error",
  newUserCallbackURL: "/welcome", // For first-time users
});
```

## Provider Configuration

### GitHub OAuth

1. Create OAuth App at https://github.com/settings/developers
2. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Add credentials to `.env`:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### Google OAuth

1. Create project at https://console.cloud.google.com
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Add credentials to `.env`:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Discord OAuth

1. Create application at https://discord.com/developers/applications
2. Add OAuth2 redirect: `http://localhost:3000/api/auth/callback/discord`
3. Add credentials:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### Apple Sign In

```ts
export const auth = betterAuth({
  socialProviders: {
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      teamId: process.env.APPLE_TEAM_ID!,
      keyId: process.env.APPLE_KEY_ID!,
      privateKey: process.env.APPLE_PRIVATE_KEY!
    }
  }
});
```

### Microsoft/Azure AD

```ts
export const auth = betterAuth({
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID, // Optional: for specific tenant
    }
  }
});
```

### Twitter/X OAuth

```ts
export const auth = betterAuth({
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }
  }
});
```

## Custom OAuth Provider

Add custom OAuth 2.0 provider:

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    customProvider: {
      clientId: process.env.CUSTOM_CLIENT_ID!,
      clientSecret: process.env.CUSTOM_CLIENT_SECRET!,
      authorizationUrl: "https://provider.com/oauth/authorize",
      tokenUrl: "https://provider.com/oauth/token",
      userInfoUrl: "https://provider.com/oauth/userinfo",
      scope: ["email", "profile"],
      // Map provider user data to Better Auth user
      mapProfile: (profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        image: profile.avatar_url
      })
    }
  }
});
```

## Account Linking

Link multiple OAuth providers to same user account.

### Server Setup

```ts
export const auth = betterAuth({
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"] // Auto-link these providers
    }
  }
});
```

### Client Usage

```ts
// Link new provider to existing account
await authClient.linkSocial({
  provider: "google",
  callbackURL: "/profile"
});

// List linked accounts
const { data: session } = await authClient.getSession();
const accounts = session.user.accounts;

// Unlink account
await authClient.unlinkAccount({
  accountId: "account-id"
});
```

## Token Management

### Access OAuth Tokens

```ts
// Server-side
const session = await auth.api.getSession({
  headers: request.headers
});

const accounts = await auth.api.listAccounts({
  userId: session.user.id
});

// Get specific provider token
const githubAccount = accounts.find(a => a.providerId === "github");
const accessToken = githubAccount.accessToken;
const refreshToken = githubAccount.refreshToken;
```

### Refresh Tokens

```ts
// Manually refresh OAuth token
const newToken = await auth.api.refreshToken({
  accountId: "account-id"
});
```

### Use Provider API

```ts
// Example: Use GitHub token to fetch repos
const githubAccount = accounts.find(a => a.providerId === "github");

const response = await fetch("https://api.github.com/user/repos", {
  headers: {
    Authorization: `Bearer ${githubAccount.accessToken}`
  }
});

const repos = await response.json();
```

## Advanced OAuth Configuration

### Custom Scopes

```ts
export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: [
        "user:email",
        "read:user",
        "repo", // Access repositories
        "gist" // Access gists
      ]
    }
  }
});
```

### State Parameter

Better Auth automatically handles OAuth state parameter for CSRF protection.

```ts
// Custom state validation
export const auth = betterAuth({
  advanced: {
    generateState: async () => {
      // Custom state generation
      return crypto.randomUUID();
    },
    validateState: async (state: string) => {
      // Custom state validation
      return true;
    }
  }
});
```

### PKCE Support

Better Auth automatically uses PKCE (Proof Key for Code Exchange) for supported providers.

```ts
export const auth = betterAuth({
  socialProviders: {
    customProvider: {
      pkce: true, // Enable PKCE
      // ... other config
    }
  }
});
```

## Error Handling

### Client-Side

```ts
await authClient.signIn.social({
  provider: "github",
  errorCallbackURL: "/auth/error"
}, {
  onError: (ctx) => {
    console.error("OAuth error:", ctx.error);
    // Handle specific errors
    if (ctx.error.code === "OAUTH_ACCOUNT_ALREADY_LINKED") {
      alert("This account is already linked to another user");
    }
  }
});
```

### Server-Side

```ts
export const auth = betterAuth({
  callbacks: {
    async onOAuthError({ error, provider }) {
      console.error(`OAuth error with ${provider}:`, error);
      // Log to monitoring service
      await logError(error);
    }
  }
});
```

## Callback URLs

### Development

```
http://localhost:3000/api/auth/callback/{provider}
```

### Production

```
https://yourdomain.com/api/auth/callback/{provider}
```

**Important:** Add all callback URLs to OAuth provider settings.

## UI Components

### Sign In Button (React)

```tsx
import { authClient } from "@/lib/auth-client";

export function SocialSignIn() {
  const handleOAuth = async (provider: string) => {
    await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard"
    });
  };

  return (
    <div className="space-y-2">
      <button onClick={() => handleOAuth("github")}>
        Sign in with GitHub
      </button>
      <button onClick={() => handleOAuth("google")}>
        Sign in with Google
      </button>
      <button onClick={() => handleOAuth("discord")}>
        Sign in with Discord
      </button>
    </div>
  );
}
```

## Best Practices

1. **Callback URLs**: Add all environments (dev, staging, prod) to OAuth app
2. **Scopes**: Request minimum scopes needed
3. **Token Storage**: Better Auth stores tokens securely in database
4. **Token Refresh**: Implement automatic token refresh for long-lived sessions
5. **Account Linking**: Enable for better UX when user signs in with different providers
6. **Error Handling**: Provide clear error messages for OAuth failures
7. **Provider Icons**: Use official brand assets for OAuth buttons
8. **Mobile Deep Links**: Configure deep links for mobile OAuth flows
9. **Email Matching**: Consider auto-linking accounts with same email
10. **Privacy**: Inform users what data you access from OAuth providers

## Common Issues

### Redirect URI Mismatch

Ensure callback URL in OAuth app matches exactly:
```
http://localhost:3000/api/auth/callback/github
```

### Missing Scopes

Add required scopes for email access:
```ts
scope: ["user:email"] // GitHub
scope: ["email"] // Google
```

### HTTPS Required

Some providers (Apple, Microsoft) require HTTPS callbacks. Use ngrok for local development:
```bash
ngrok http 3000
```

### CORS Errors

Configure CORS if frontend/backend on different domains:
```ts
export const auth = betterAuth({
  advanced: {
    corsOptions: {
      origin: ["https://yourdomain.com"],
      credentials: true
    }
  }
});
```
