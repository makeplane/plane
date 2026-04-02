# Backend Authentication & Authorization

Modern authentication patterns including OAuth 2.1, JWT, RBAC, and MFA (2025 standards).

## OAuth 2.1 (2025 Standard)

### Key Changes from OAuth 2.0

**Mandatory:**
- PKCE (Proof Key for Code Exchange) for all clients
- Exact redirect URI matching
- State parameter for CSRF protection

**Deprecated:**
- Implicit grant flow (security risk)
- Resource owner password credentials grant
- Bearer token in query strings

### Authorization Code Flow with PKCE

```typescript
// Step 1: Generate code verifier and challenge
import crypto from 'crypto';

const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Step 2: Redirect to authorization endpoint
const authUrl = new URL('https://auth.example.com/authorize');
authUrl.searchParams.set('client_id', 'your-client-id');
authUrl.searchParams.set('redirect_uri', 'https://app.example.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Step 3: Exchange code for token (with code_verifier)
const tokenResponse = await fetch('https://auth.example.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  }),
});
```

## JWT (JSON Web Tokens)

### Structure

```
Header.Payload.Signature
eyJhbGciOi...  .  eyJzdWIiOi...  .  SflKxwRJ...
```

### Best Practices (2025)

1. **Short expiration** - Access tokens: 15 minutes, Refresh tokens: 7 days
2. **Use RS256** - Asymmetric signing (not HS256 for public APIs)
3. **Validate everything** - Signature, issuer, audience, expiration
4. **Include minimal claims** - Don't include sensitive data
5. **Refresh token rotation** - Issue new refresh token on each use

### Implementation

```typescript
import jwt from 'jsonwebtoken';

// Generate JWT
const accessToken = jwt.sign(
  {
    sub: user.id,
    email: user.email,
    roles: user.roles,
  },
  process.env.JWT_PRIVATE_KEY,
  {
    algorithm: 'RS256',
    expiresIn: '15m',
    issuer: 'https://api.example.com',
    audience: 'https://app.example.com',
  }
);

// Verify JWT
const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
  algorithms: ['RS256'],
  issuer: 'https://api.example.com',
  audience: 'https://app.example.com',
});
```

## Role-Based Access Control (RBAC)

### RBAC Model

```
Users → Roles → Permissions → Resources
```

### Implementation (NestJS Example)

```typescript
// Define roles
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

// Role decorator
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Guard implementation
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
async createPost(@Body() createPostDto: CreatePostDto) {
  return this.postsService.create(createPostDto);
}
```

### RBAC Best Practices

1. **Deny by default** - Explicitly grant permissions
2. **Least privilege** - Minimum permissions needed
3. **Role hierarchy** - Admin inherits Editor inherits Viewer
4. **Separate roles and permissions** - Flexible permission assignment
5. **Audit trail** - Log role changes and access

## Multi-Factor Authentication (MFA)

### TOTP (Time-Based One-Time Password)

```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generate secret
const secret = speakeasy.generateSecret({
  name: 'MyApp',
  issuer: 'MyCompany',
});

// Generate QR code for user
const qrCode = await QRCode.toDataURL(secret.otpauth_url);

// Verify TOTP token
const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: userToken,
  window: 2, // Allow 2 time steps drift
});
```

### FIDO2/WebAuthn (Passwordless - 2025 Standard)

**Benefits:**
- Phishing-resistant
- No shared secrets
- Hardware-backed security
- Better UX (biometrics, security keys)

**Implementation:**
```typescript
// Registration
const publicKeyCredentialCreationOptions = {
  challenge: crypto.randomBytes(32),
  rp: { name: 'MyApp', id: 'example.com' },
  user: {
    id: Buffer.from(user.id),
    name: user.email,
    displayName: user.name,
  },
  pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
  authenticatorSelection: {
    authenticatorAttachment: 'platform', // 'platform' or 'cross-platform'
    userVerification: 'required',
  },
  timeout: 60000,
  attestation: 'direct',
};

// Use @simplewebauthn/server library
import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server';
```

## Session Management

### Best Practices

1. **Secure cookies** - HttpOnly, Secure, SameSite=Strict
2. **Session timeout** - Idle: 15 minutes, Absolute: 8 hours
3. **Regenerate session ID** - After login, privilege elevation
4. **Server-side storage** - Redis for distributed systems
5. **CSRF protection** - SameSite cookies + CSRF tokens

### Implementation

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient();
await redisClient.connect();

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true, // No JavaScript access
      sameSite: 'strict', // CSRF protection
      maxAge: 1000 * 60 * 15, // 15 minutes
    },
  })
);
```

## Password Security

### Argon2id (2025 Standard - Replaces bcrypt)

**Why Argon2id:**
- Winner of Password Hashing Competition (2015)
- Memory-hard (resistant to GPU/ASIC attacks)
- Configurable CPU and memory cost
- Combines Argon2i (data-independent) + Argon2d (data-dependent)

```typescript
import argon2 from 'argon2';

// Hash password
const hash = await argon2.hash('password123', {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 threads
});

// Verify password
const valid = await argon2.verify(hash, 'password123');
```

### Password Policy (2025 NIST Guidelines)

- **Minimum length:** 12 characters (not 8)
- **No composition rules** - Allow passphrases
- **Check against breach databases** - HaveIBeenPwned API
- **No periodic rotation** - Only on compromise
- **Allow all printable characters** - Including spaces, emojis

## API Key Authentication

### Best Practices

1. **Prefix keys** - `sk_live_`, `pk_test_` (identify type/environment)
2. **Hash stored keys** - Store SHA-256 hash, not plaintext
3. **Key rotation** - Allow users to rotate keys
4. **Scope limiting** - Separate keys for read/write operations
5. **Rate limiting** - Per API key limits

```typescript
// Generate API key
const apiKey = `sk_${env}_${crypto.randomBytes(24).toString('base64url')}`;

// Store hashed version
const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
await db.apiKeys.create({ userId, hashedKey, scopes: ['read'] });

// Validate API key
const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
const keyRecord = await db.apiKeys.findOne({ hashedKey: providedHash });
```

## Authentication Decision Matrix

| Use Case | Recommended Approach |
|----------|---------------------|
| Web application | OAuth 2.1 + JWT |
| Mobile app | OAuth 2.1 + PKCE |
| SPA (Single Page App) | OAuth 2.1 Authorization Code + PKCE |
| Server-to-server | Client credentials grant + mTLS |
| Third-party API access | API keys with scopes |
| High-security | WebAuthn/FIDO2 + MFA |
| Internal admin | JWT + RBAC + MFA |
| Microservices | Service mesh (mTLS) + JWT |

## Security Checklist

- [ ] OAuth 2.1 with PKCE implemented
- [ ] JWT tokens expire in 15 minutes
- [ ] Refresh token rotation enabled
- [ ] RBAC with deny-by-default
- [ ] MFA required for admin accounts
- [ ] Passwords hashed with Argon2id
- [ ] Session cookies: HttpOnly, Secure, SameSite
- [ ] Rate limiting on auth endpoints (10 attempts/15 min)
- [ ] Account lockout after failed attempts
- [ ] Password policy: 12+ chars, breach check
- [ ] Audit logging for authentication events

## Resources

- **OAuth 2.1:** https://oauth.net/2.1/
- **JWT Best Practices:** https://datatracker.ietf.org/doc/html/rfc8725
- **WebAuthn:** https://webauthn.guide/
- **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/
- **OWASP Auth Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
