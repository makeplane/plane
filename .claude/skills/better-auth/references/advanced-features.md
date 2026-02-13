# Advanced Features

Better Auth plugins extend functionality beyond basic authentication.

## Two-Factor Authentication

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "YourAppName", // TOTP issuer name
      otpOptions: {
        period: 30, // OTP validity period (seconds)
        digits: 6, // OTP length
      }
    })
  ]
});
```

### Client Setup

```ts
import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor", // Redirect to 2FA verification page
      redirect: true // Auto-redirect if 2FA required
    })
  ]
});
```

### Enable 2FA for User

```ts
// Enable TOTP
const { data } = await authClient.twoFactor.enable({
  password: "userPassword" // Verify user identity
});

// data contains QR code URI for authenticator app
const qrCodeUri = data.totpURI;
const backupCodes = data.backupCodes; // Save these securely
```

### Verify TOTP Code

```ts
await authClient.twoFactor.verifyTOTP({
  code: "123456",
  trustDevice: true // Skip 2FA on this device for 30 days
});
```

### Disable 2FA

```ts
await authClient.twoFactor.disable({
  password: "userPassword"
});
```

### Backup Codes

```ts
// Generate new backup codes
const { data } = await authClient.twoFactor.generateBackupCodes({
  password: "userPassword"
});

// Use backup code instead of TOTP
await authClient.twoFactor.verifyBackupCode({
  code: "backup-code-123"
});
```

## Passkeys (WebAuthn)

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    passkey({
      rpName: "YourApp", // Relying Party name
      rpID: "yourdomain.com" // Your domain
    })
  ]
});
```

### Client Setup

```ts
import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [passkeyClient()]
});
```

### Register Passkey

```ts
// User must be authenticated first
await authClient.passkey.register({
  name: "My Laptop" // Optional: name for this passkey
});
```

### Sign In with Passkey

```ts
await authClient.passkey.signIn();
```

### List User Passkeys

```ts
const { data } = await authClient.passkey.list();
// data contains array of registered passkeys
```

### Delete Passkey

```ts
await authClient.passkey.delete({
  id: "passkey-id"
});
```

## Magic Link

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        await sendEmail({
          to: email,
          subject: "Sign in to YourApp",
          html: `Click <a href="${url}">here</a> to sign in.`
        });
      },
      expiresIn: 300, // Link expires in 5 minutes (seconds)
    })
  ]
});
```

### Client Setup

```ts
import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [magicLinkClient()]
});
```

### Send Magic Link

```ts
await authClient.magicLink.sendMagicLink({
  email: "user@example.com",
  callbackURL: "/dashboard"
});
```

### Verify Magic Link

```ts
// Called automatically when user clicks link
// Token in URL query params handled by Better Auth
await authClient.magicLink.verify({
  token: "token-from-url"
});
```

## Organizations (Multi-Tenancy)

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5, // Max orgs per user
      creatorRole: "owner" // Role for org creator
    })
  ]
});
```

### Client Setup

```ts
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient()]
});
```

### Create Organization

```ts
await authClient.organization.create({
  name: "Acme Corp",
  slug: "acme", // Unique slug
  metadata: {
    industry: "Technology"
  }
});
```

### Invite Members

```ts
await authClient.organization.inviteMember({
  organizationId: "org-id",
  email: "user@example.com",
  role: "member", // owner, admin, member
  message: "Join our team!" // Optional
});
```

### Accept Invitation

```ts
await authClient.organization.acceptInvitation({
  invitationId: "invitation-id"
});
```

### List Organizations

```ts
const { data } = await authClient.organization.list();
// Returns user's organizations
```

### Update Member Role

```ts
await authClient.organization.updateMemberRole({
  organizationId: "org-id",
  userId: "user-id",
  role: "admin"
});
```

### Remove Member

```ts
await authClient.organization.removeMember({
  organizationId: "org-id",
  userId: "user-id"
});
```

### Delete Organization

```ts
await authClient.organization.delete({
  organizationId: "org-id"
});
```

## Session Management

### Configure Session Expiration

```ts
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (seconds)
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache for 5 minutes
    }
  }
});
```

### Server-Side Session

```ts
// Next.js
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers()
});

if (!session) {
  // Not authenticated
}
```

### Client-Side Session

```tsx
// React
import { authClient } from "@/lib/auth-client";

function UserProfile() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Hello, {session.user.name}!</div>;
}
```

### List Active Sessions

```ts
const { data: sessions } = await authClient.listSessions();
// Returns all active sessions for current user
```

### Revoke Session

```ts
await authClient.revokeSession({
  sessionId: "session-id"
});
```

### Revoke All Sessions

```ts
await authClient.revokeAllSessions();
```

## Rate Limiting

### Server Configuration

```ts
export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60, // Time window in seconds
    max: 10, // Max requests per window
    storage: "memory", // "memory" or "database"
    customRules: {
      "/api/auth/sign-in": {
        window: 60,
        max: 5 // Stricter limit for sign-in
      },
      "/api/auth/sign-up": {
        window: 3600,
        max: 3 // 3 signups per hour
      }
    }
  }
});
```

### Custom Rate Limiter

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    customLimiter: async ({ request, limit }) => {
      // Custom rate limiting logic
      const ip = request.headers.get("x-forwarded-for");
      const key = `ratelimit:${ip}`;

      // Use Redis, etc.
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, limit.window);
      }

      if (count > limit.max) {
        throw new Error("Rate limit exceeded");
      }
    }
  }
});
```

## Anonymous Sessions

Track users before they sign up.

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [anonymous()]
});
```

### Client Usage

```ts
// Create anonymous session
const { data } = await authClient.signIn.anonymous();

// Convert to full account
await authClient.signUp.email({
  email: "user@example.com",
  password: "password123",
  linkAnonymousSession: true // Link anonymous data
});
```

## Email OTP

One-time password via email (passwordless).

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        await sendEmail({
          to: email,
          subject: "Your verification code",
          text: `Your code is: ${otp}`
        });
      },
      expiresIn: 300, // 5 minutes
      length: 6 // OTP length
    })
  ]
});
```

### Client Usage

```ts
// Send OTP to email
await authClient.emailOTP.sendOTP({
  email: "user@example.com"
});

// Verify OTP
await authClient.emailOTP.verifyOTP({
  email: "user@example.com",
  otp: "123456"
});
```

## Phone Number Authentication

Requires phone number plugin.

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, otp }) => {
        // Use Twilio, AWS SNS, etc.
        await sendSMS(phoneNumber, `Your code: ${otp}`);
      }
    })
  ]
});
```

### Client Usage

```ts
// Sign up with phone
await authClient.signUp.phoneNumber({
  phoneNumber: "+1234567890",
  password: "password123"
});

// Send OTP
await authClient.phoneNumber.sendOTP({
  phoneNumber: "+1234567890"
});

// Verify OTP
await authClient.phoneNumber.verifyOTP({
  phoneNumber: "+1234567890",
  otp: "123456"
});
```

## Best Practices

1. **2FA**: Offer 2FA as optional, make mandatory for admin users
2. **Passkeys**: Implement as progressive enhancement (fallback to password)
3. **Magic Links**: Set short expiration (5-15 minutes)
4. **Organizations**: Implement RBAC for org permissions
5. **Sessions**: Use short expiration for sensitive apps
6. **Rate Limiting**: Enable in production, adjust limits based on usage
7. **Anonymous Sessions**: Clean up old anonymous sessions periodically
8. **Backup Codes**: Force users to save backup codes before enabling 2FA
9. **Multi-Device**: Allow users to manage trusted devices
10. **Audit Logs**: Track sensitive operations (role changes, 2FA changes)

## Regenerate Schema After Plugins

After adding any plugin:

```bash
npx @better-auth/cli generate
npx @better-auth/cli migrate # if using Kysely
```

Or manually apply migrations for your ORM (Drizzle, Prisma).
