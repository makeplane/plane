# Configuration

## Wrangler Config

### Basic Binding

**wrangler.jsonc**:

```jsonc
{
  "secrets_store_secrets": [
    {
      "binding": "API_KEY",
      "store_id": "abc123",
      "secret_name": "stripe_api_key"
    }
  ]
}
```

**wrangler.toml** (alternative):

```toml
[[secrets_store_secrets]]
binding = "API_KEY"
store_id = "abc123"
secret_name = "stripe_api_key"
```

Fields:
- `binding`: Variable name for `env` access
- `store_id`: From `wrangler secrets-store store list`
- `secret_name`: Identifier (no spaces)

### Environment-Specific

**wrangler.jsonc**:

```jsonc
{
  "env": {
    "production": {
      "secrets_store_secrets": [
        {
          "binding": "API_KEY",
          "store_id": "prod-store",
          "secret_name": "prod_api_key"
        }
      ]
    },
    "staging": {
      "secrets_store_secrets": [
        {
          "binding": "API_KEY",
          "store_id": "staging-store",
          "secret_name": "staging_api_key"
        }
      ]
    }
  }
}
```

**wrangler.toml** (alternative):

```toml
[env.production]
[[env.production.secrets_store_secrets]]
binding = "API_KEY"
store_id = "prod-store"
secret_name = "prod_api_key"

[env.staging]
[[env.staging.secrets_store_secrets]]
binding = "API_KEY"
store_id = "staging-store"
secret_name = "staging_api_key"
```

## Wrangler Commands

### Store Management

```bash
wrangler secrets-store store list
wrangler secrets-store store create my-store --remote
wrangler secrets-store store delete <store-id> --remote
```

### Secret Management (Production)

```bash
# Create (interactive)
wrangler secrets-store secret create <store-id> \
  --name MY_SECRET --scopes workers --remote

# Create (piped)
cat secret.txt | wrangler secrets-store secret create <store-id> \
  --name MY_SECRET --scopes workers --remote

# List/get/update/delete
wrangler secrets-store secret list <store-id> --remote
wrangler secrets-store secret get <store-id> --name MY_SECRET --remote
wrangler secrets-store secret update <store-id> --name MY_SECRET --new-value "val" --remote
wrangler secrets-store secret delete <store-id> --name MY_SECRET --remote

# Duplicate
wrangler secrets-store secret duplicate <store-id> \
  --name ORIG --new-name COPY --remote
```

### Local Development

**CRITICAL**: Production secrets (`--remote`) NOT accessible in local dev.

```bash
# Create local-only (no --remote)
wrangler secrets-store secret create <store-id> --name DEV_KEY --scopes workers

wrangler dev    # Uses local secrets
wrangler deploy # Uses production secrets
```

Best practice: Separate names for local/prod:

```jsonc
{
  "env": {
    "development": {
      "secrets_store_secrets": [
        { "binding": "API_KEY", "store_id": "store", "secret_name": "dev_api_key" }
      ]
    },
    "production": {
      "secrets_store_secrets": [
        { "binding": "API_KEY", "store_id": "store", "secret_name": "prod_api_key" }
      ]
    }
  }
}
```

## Dashboard

### Creating Secrets

1. **Secrets Store** → **Create secret**
2. Fill: Name (no spaces), Value, Scope (`Workers`), Comment
3. **Save** (value hidden after)

### Adding Bindings

**Method 1**: Worker → Settings → Bindings → Add → Secrets Store
**Method 2**: Create secret directly from Worker settings dropdown

Deploy options:
- **Deploy**: Immediate 100%
- **Save version**: Gradual rollout

## CI/CD

### GitHub Actions

```yaml
- name: Create secret
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CF_TOKEN }}
  run: |
    echo "${{ secrets.API_KEY }}" | \
    npx wrangler secrets-store secret create $STORE_ID \
      --name API_KEY --scopes workers --remote

- name: Deploy
  run: npx wrangler deploy
```

### GitLab CI

```yaml
script:
  - echo "$API_KEY_VALUE" | npx wrangler secrets-store secret create $STORE_ID --name API_KEY --scopes workers --remote
  - npx wrangler deploy
```

See: [api.md](./api.md), [patterns.md](./patterns.md)
