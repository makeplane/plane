# Plugin Marketplace Sources

Plugin source types for `marketplace.json` plugin entries.

## Relative Paths (Same Repo)

```json
{ "name": "my-plugin", "source": "./plugins/my-plugin" }
```

**Note:** Only works when marketplace added via Git (GitHub/GitLab/git URL). URL-based marketplaces only download `marketplace.json`, not plugin files. Use GitHub/git sources for URL-based distribution.

## GitHub Repositories

```json
{
  "name": "github-plugin",
  "source": { "source": "github", "repo": "owner/plugin-repo" }
}
```

Pin to specific version:
```json
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `repo` | string | Required. `owner/repo` format |
| `ref` | string | Optional. Branch or tag (defaults to repo default) |
| `sha` | string | Optional. Full 40-char commit SHA for exact pinning |

## Git Repositories (GitLab, Bitbucket, etc.)

```json
{
  "name": "git-plugin",
  "source": { "source": "url", "url": "https://gitlab.com/team/plugin.git" }
}
```

Pin to specific version:
```json
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git",
    "ref": "main",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Required. Full git URL (must end `.git`) |
| `ref` | string | Optional. Branch or tag |
| `sha` | string | Optional. Full 40-char commit SHA |

## Advanced Example (All Features)

```json
{
  "name": "enterprise-tools",
  "source": { "source": "github", "repo": "company/enterprise-plugin" },
  "description": "Enterprise workflow automation tools",
  "version": "2.1.0",
  "author": { "name": "Enterprise Team", "email": "enterprise@example.com" },
  "homepage": "https://docs.example.com/plugins/enterprise-tools",
  "license": "MIT",
  "keywords": ["enterprise", "workflow", "automation"],
  "category": "productivity",
  "commands": ["./commands/core/", "./commands/enterprise/"],
  "agents": ["./agents/security-reviewer.md", "./agents/compliance-checker.md"],
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh" }]
    }]
  },
  "mcpServers": {
    "enterprise-db": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  },
  "strict": false
}
```

**Key notes:**
- `${CLAUDE_PLUGIN_ROOT}` — references files within plugin's installation cache directory
- `strict: false` — marketplace entry defines plugin entirely, no `plugin.json` needed
- `commands`/`agents` — multiple directories or individual files, paths relative to plugin root
