# Email/Password Authentication

Email/password is built-in auth method in Better Auth. No plugins required for basic functionality.

## Server Configuration

### Basic Setup

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Auto sign-in after signup (default: true)
    requireEmailVerification: false, // Require email verification before login
    sendResetPasswordToken: async ({ user, url }) => {
      // Send password reset email
      await sendEmail(user.email, url);
    }
  }
});
```

### Custom Password Requirements

```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    }
  }
});
```

## Client Usage

### Sign Up

```ts
import { authClient } from "@/lib/auth-client";

const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "securePassword123",
  name: "John Doe",
  image: "https://example.com/avatar.jpg", // optional
  callbackURL: "/dashboard" // optional
}, {
  onSuccess: (ctx) => {
    // ctx.data contains user and session
    console.log("User created:", ctx.data.user);
  },
  onError: (ctx) => {
    alert(ctx.error.message);
  }
});
```

### Sign In

```ts
const { data, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "securePassword123",
  callbackURL: "/dashboard",
  rememberMe: true // default: true
}, {
  onSuccess: () => {
    // redirect or update UI
  },
  onError: (ctx) => {
    console.error(ctx.error.message);
  }
});
```

### Sign Out

```ts
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      router.push("/login");
    }
  }
});
```

## Email Verification

### Server Setup

```ts
export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      // Send verification email
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `Click <a href="${url}">here</a> to verify your email.`
      });
    },
    sendOnSignUp: true, // Send verification email on signup
    autoSignInAfterVerification: true // Auto sign-in after verification
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true // Require verification before login
  }
});
```

### Client Usage

```ts
// Send verification email
await authClient.sendVerificationEmail({
  email: "user@example.com",
  callbackURL: "/verify-success"
});

// Verify email with token
await authClient.verifyEmail({
  token: "verification-token-from-email"
});
```

## Password Reset Flow

### Server Setup

```ts
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    sendResetPasswordToken: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `Click <a href="${url}">here</a> to reset your password.`
      });
    }
  }
});
```

### Client Flow

```ts
// Step 1: Request password reset
await authClient.forgetPassword({
  email: "user@example.com",
  redirectTo: "/reset-password"
});

// Step 2: Reset password with token
await authClient.resetPassword({
  token: "reset-token-from-email",
  password: "newSecurePassword123"
});
```

### Change Password (Authenticated)

```ts
await authClient.changePassword({
  currentPassword: "oldPassword123",
  newPassword: "newPassword456",
  revokeOtherSessions: true // Optional: logout other sessions
});
```

## Username Authentication

Requires `username` plugin for username-based auth.

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    username({
      // Allow sign in with username or email
      allowUsernameOrEmail: true
    })
  ]
});
```

### Client Setup

```ts
import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient()]
});
```

### Client Usage

```ts
// Sign up with username
await authClient.signUp.username({
  username: "johndoe",
  password: "securePassword123",
  email: "john@example.com", // optional
  name: "John Doe"
});

// Sign in with username
await authClient.signIn.username({
  username: "johndoe",
  password: "securePassword123"
});

// Sign in with username or email (if allowUsernameOrEmail: true)
await authClient.signIn.username({
  username: "johndoe", // or "john@example.com"
  password: "securePassword123"
});
```

## Framework Setup

### Next.js (App Router)

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### Next.js (Pages Router)

```ts
// pages/api/auth/[...all].ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export default toNextJsHandler(auth);
```

### Nuxt

```ts
// server/api/auth/[...all].ts
import { auth } from "~/utils/auth";
import { toWebRequest } from "better-auth/utils/web";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
```

### SvelteKit

```ts
// hooks.server.ts
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth });
}
```

### Astro

```ts
// pages/api/auth/[...all].ts
import { auth } from "@/lib/auth";

export async function ALL({ request }: { request: Request }) {
  return auth.handler(request);
}
```

### Hono

```ts
import { Hono } from "hono";
import { auth } from "./auth";

const app = new Hono();

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
```

### Express

```ts
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();

app.all("/api/auth/*", toNodeHandler(auth));
```

## Protected Routes

### Next.js Middleware

```ts
// middleware.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"]
};
```

### SvelteKit Hooks

```ts
// hooks.server.ts
import { auth } from "$lib/auth";
import { redirect } from "@sveltejs/kit";

export async function handle({ event, resolve }) {
  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  if (event.url.pathname.startsWith("/dashboard") && !session) {
    throw redirect(303, "/login");
  }

  return resolve(event);
}
```

### Nuxt Middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await useAuthSession();

  if (!session.value && to.path.startsWith("/dashboard")) {
    return navigateTo("/login");
  }
});
```

## User Profile Management

### Get Current User

```ts
const { data: session } = await authClient.getSession();
console.log(session.user);
```

### Update User Profile

```ts
await authClient.updateUser({
  name: "New Name",
  image: "https://example.com/new-avatar.jpg",
  // Custom fields if defined in schema
});
```

### Delete User Account

```ts
await authClient.deleteUser({
  password: "currentPassword", // Required for security
  callbackURL: "/" // Redirect after deletion
});
```

## Best Practices

1. **Password Security**: Enforce strong password requirements
2. **Email Verification**: Enable for production to prevent spam
3. **Rate Limiting**: Prevent brute force attacks (see advanced-features.md)
4. **HTTPS**: Always use HTTPS in production
5. **Error Messages**: Don't reveal if email exists during login
6. **Session Security**: Use secure, httpOnly cookies
7. **CSRF Protection**: Better Auth handles this automatically
8. **Password Reset**: Set short expiration for reset tokens
9. **Account Lockout**: Consider implementing after N failed attempts
10. **Audit Logs**: Track auth events for security monitoring
