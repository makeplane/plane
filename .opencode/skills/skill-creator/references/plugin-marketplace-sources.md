# Plugin Marketplace Sources

## Source Types

### Relative Paths (Local)

For plugins in same repository:

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin"
}
```

**Note:** Relative paths only work when users add marketplace via Git. For URL-based distribution, use GitHub, npm, or git URL sources.

### GitHub Repositories

```json
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo"
  }
}
```

Pin to specific branch, tag, or commit:

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

| Field  | Type   | Description                                          |
|--------|--------|------------------------------------------------------|
| `repo` | string | Required. GitHub repo in `owner/repo` format         |
| `ref`  | string | Optional. Git branch or tag                          |
| `sha`  | string | Optional. Full 40-char git commit SHA                |

### Git Repositories (GitLab, Bitbucket, etc.)

```json
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git"
  }
}
```

| Field | Type   | Description                                 |
|-------|--------|---------------------------------------------|
| `url` | string | Required. Full git URL (must end with .git) |
| `ref` | string | Optional. Git branch or tag                 |
| `sha` | string | Optional. Full 40-char git commit SHA       |

## Advanced Plugin Entry Example

```json
{
  "name": "enterprise-tools",
  "source": {
    "source": "github",
    "repo": "company/enterprise-plugin"
  },
  "description": "Enterprise workflow automation tools",
  "version": "2.1.0",
  "commands": [
    "./commands/core/",
    "./commands/enterprise/"
  ],
  "agents": ["./agents/security-reviewer.md"],
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"
      }]
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

**Key variable:** `${CLAUDE_PLUGIN_ROOT}` - Use in hooks and MCP configs to reference files within plugin's installation directory (plugins are copied to cache when installed).
