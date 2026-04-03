# Plugin Marketplace Hosting & Distribution

## GitHub (Recommended)

1. Create repository for marketplace
2. Add `.claude-plugin/marketplace.json` with plugin definitions
3. Share: users add via `/plugin marketplace add owner/repo`

Benefits: version control, issue tracking, team collaboration.

## Other Git Services (GitLab, Bitbucket, Self-Hosted)

```shell
/plugin marketplace add https://gitlab.com/company/plugins.git
```

## Private Repositories

### Manual Install/Update
Uses existing git credential helpers. If `git clone` works in terminal, it works in Claude Code.
Common helpers: `gh auth login` (GitHub), macOS Keychain, `git-credential-store`.

### Background Auto-Updates
Runs at startup without credential helpers. Set auth tokens in environment:

| Provider | Env Variables | Notes |
|----------|--------------|-------|
| GitHub | `GITHUB_TOKEN` or `GH_TOKEN` | PAT or GitHub App token |
| GitLab | `GITLAB_TOKEN` or `GL_TOKEN` | PAT or project token |
| Bitbucket | `BITBUCKET_TOKEN` | App password or repo token |

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

CI/CD: configure as secret env variable. GitHub Actions auto-provides `GITHUB_TOKEN`.

## Team Configuration

### Auto-Prompt Marketplace Install

Add to `.claude/settings.json` in your repo:

```json
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": { "source": "github", "repo": "your-org/claude-plugins" }
    }
  }
}
```

### Default-Enabled Plugins

```json
{
  "enabledPlugins": {
    "code-formatter@company-tools": true,
    "deployment-tools@company-tools": true
  }
}
```

## Managed Marketplace Restrictions

Admins restrict allowed marketplaces via `strictKnownMarketplaces` in managed settings:

| Value | Behavior |
|-------|----------|
| Undefined | No restrictions, users add any marketplace |
| Empty `[]` | Complete lockdown, no new marketplaces |
| List of sources | Users can only add matching marketplaces |

### Allow Specific Only

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/approved-plugins" },
    { "source": "github", "repo": "acme-corp/security-tools", "ref": "v2.0" },
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

**Matching rules:** Exact match for most types. GitHub: `repo` required, `ref`/`path` must match if specified. URL: full URL exact match. `hostPattern`: regex against host. Validated before any network/filesystem ops. Cannot be overridden by user/project settings.

## Local Testing

```shell
/plugin marketplace add ./my-local-marketplace
/plugin install test-plugin@my-local-marketplace
```
