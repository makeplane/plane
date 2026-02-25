# Plugin Marketplace Hosting & Distribution

## GitHub (Recommended)

1. Create repository for marketplace
2. Add `.claude-plugin/marketplace.json` with plugin definitions
3. Share: users add with `/plugin marketplace add owner/repo`

**Benefits:** Built-in version control, issue tracking, team collaboration.

## Other Git Services

GitLab, Bitbucket, self-hosted servers all work:

```shell
/plugin marketplace add https://gitlab.com/company/plugins.git
```

## Private Repositories

### Manual Installation/Updates

Claude Code uses existing git credential helpers. If `git clone` works in terminal, it works in Claude Code.

Common credential helpers:
- `gh auth login` for GitHub
- macOS Keychain
- `git-credential-store`

### Background Auto-Updates

Set authentication token in environment:

| Provider  | Environment Variables        | Notes                        |
|-----------|------------------------------|------------------------------|
| GitHub    | `GITHUB_TOKEN` or `GH_TOKEN` | Personal or GitHub App token |
| GitLab    | `GITLAB_TOKEN` or `GL_TOKEN` | Personal or project token    |
| Bitbucket | `BITBUCKET_TOKEN`            | App password or repo token   |

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Require Marketplaces for Team

Add to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "code-formatter@company-tools": true,
    "deployment-tools@company-tools": true
  }
}
```

## Managed Marketplace Restrictions

Admins use `strictKnownMarketplaces` in managed settings:

| Value               | Behavior                                    |
|---------------------|---------------------------------------------|
| Undefined (default) | No restrictions, users can add any          |
| Empty array `[]`    | Complete lockdown, no new marketplaces      |
| List of sources     | Users can only add from allowlist           |

### Allow Specific Marketplaces Only

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/approved-plugins" },
    { "source": "url", "url": "https://plugins.example.com/marketplace.json" }
  ]
}
```

### Allow All from Internal Server (Regex)

```json
{
  "strictKnownMarketplaces": [
    { "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
  ]
}
```

## Test Locally Before Distribution

```shell
/plugin marketplace add ./my-local-marketplace
/plugin install test-plugin@my-local-marketplace
```
