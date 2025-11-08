# Generated Environment Files

## 📦 What's Included

Two files have been generated locally for your deployment:

### 1. `.env.generated` - Ready-to-Use Environment File
- **Location:** `/home/user/plane/.env.generated`
- **Contains:** Fully populated environment variables with strong, randomly generated secrets
- **Status:** ⚠️ **NOT committed to git** (contains real passwords)

### 2. `CREDENTIALS_REFERENCE.md` - Credential Reference Guide
- **Location:** `/home/user/plane/CREDENTIALS_REFERENCE.md`
- **Contains:** Easy reference for all generated credentials
- **Status:** ⚠️ **NOT committed to git** (contains real passwords)

## 🔐 Generated Credentials

All passwords and secrets have been generated using cryptographically secure random values:

| Credential | Length | Type |
|------------|--------|------|
| PostgreSQL Password | 32 chars | Alphanumeric + Special |
| RabbitMQ Password | 32 chars | Alphanumeric + Special |
| MinIO Access Key | 20 chars | Alphanumeric |
| MinIO Secret Key | 40 chars | Alphanumeric |
| Django SECRET_KEY | 64 chars | Hex |
| Live Server Secret | 32 chars | Hex |

## 🚀 How to Use

### Option 1: Deploy to Dokploy (Recommended)

1. **Open `.env.generated`** and update these values:
   ```bash
   APP_DOMAIN=plane.yourdomain.com
   WEB_URL=https://plane.yourdomain.com
   CORS_ALLOWED_ORIGINS=https://plane.yourdomain.com
   ```

2. **Copy all variables** to Dokploy's Environment Variables section

3. **Deploy** using `docker-compose.dokploy.yml`

### Option 2: Local Docker Compose

1. **Copy to `.env`:**
   ```bash
   cp .env.generated .env
   ```

2. **Update domain values** in `.env`

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.dokploy.yml up -d
   ```

## 📋 Credential Locations

View your credentials in `CREDENTIALS_REFERENCE.md`:
- Database connection strings
- MinIO console access
- RabbitMQ management UI
- Application secrets
- Backup commands
- Emergency access procedures

## ⚠️ Important Security Notes

### These Files Are Gitignored

Both files are automatically excluded from git:
```gitignore
.env.generated
CREDENTIALS_REFERENCE.md
```

**Why?** They contain real production passwords that should never be committed to version control.

### Backup Your Credentials

**Store securely in:**
- Password manager (1Password, LastPass, Bitwarden)
- Encrypted notes
- Secure company documentation

**DO NOT:**
- ❌ Commit to git
- ❌ Email unencrypted
- ❌ Share in Slack/Discord
- ❌ Store in cloud docs without encryption

## 🔄 Regenerating Credentials

If you need new random credentials:

```bash
python3 -c "
import secrets
import string

def generate_password(length=32):
    alphabet = string.ascii_letters + string.digits + '!@#\$%^&*'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_hex(length=32):
    return secrets.token_hex(length)

def generate_alphanum(length=20):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

print('POSTGRES_PASSWORD=' + generate_password(32))
print('RABBITMQ_PASSWORD=' + generate_password(32))
print('AWS_ACCESS_KEY_ID=' + generate_alphanum(20))
print('AWS_SECRET_ACCESS_KEY=' + generate_alphanum(40))
print('SECRET_KEY=' + generate_hex(32))
print('LIVE_SERVER_SECRET_KEY=' + generate_hex(16))
"
```

## 📊 File Status

| File | Committed | Contains Secrets | Purpose |
|------|-----------|------------------|---------|
| `.env.generated` | ❌ No | ✅ Yes | Production-ready environment file |
| `CREDENTIALS_REFERENCE.md` | ❌ No | ✅ Yes | Credential reference guide |
| `.env.dokploy` | ✅ Yes | ❌ No | Template with placeholders |
| `docker-compose.dokploy.yml` | ✅ Yes | ❌ No | Dokploy deployment config |
| `DOKPLOY_DEPLOYMENT.md` | ✅ Yes | ❌ No | Deployment guide |

## 🎯 Quick Reference

**Location of generated files:**
```
/home/user/plane/
├── .env.generated              ← Use this for deployment
├── CREDENTIALS_REFERENCE.md    ← Your password reference
└── GENERATED_ENV_README.md     ← This file
```

**What to commit:**
- ✅ `.gitignore` (updated to exclude generated files)
- ✅ `.env.dokploy` (template only, no real passwords)
- ✅ `docker-compose.dokploy.yml`
- ✅ `DOKPLOY_DEPLOYMENT.md`
- ✅ This README

**What NOT to commit:**
- ❌ `.env.generated` (has real passwords)
- ❌ `CREDENTIALS_REFERENCE.md` (has real passwords)
- ❌ `.env` (if you create it)

## 🔐 Verification Checklist

Before deploying, verify:

- [ ] Updated `APP_DOMAIN` in `.env.generated`
- [ ] Updated `WEB_URL` in `.env.generated`
- [ ] Updated `CORS_ALLOWED_ORIGINS` in `.env.generated`
- [ ] Backed up `.env.generated` to secure location
- [ ] Backed up `CREDENTIALS_REFERENCE.md` to password manager
- [ ] DNS points to your Dokploy server
- [ ] Ports 80 and 443 are open
- [ ] `.env.generated` is NOT committed to git

## 📞 Support

If you need to regenerate or have questions:
1. Review `DOKPLOY_DEPLOYMENT.md` for deployment guide
2. Check `CREDENTIALS_REFERENCE.md` for password reference
3. Use the regeneration script above for new secrets

---

**Generated:** 2025-11-08
**Purpose:** Dokploy deployment with full Enterprise Edition (no telemetry, no licensing)
**Security:** All credentials are cryptographically secure random values
