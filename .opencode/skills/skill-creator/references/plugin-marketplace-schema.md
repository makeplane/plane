# Plugin Marketplace Schema

Full JSON schema for `.claude-plugin/marketplace.json`.

## Required Top-Level Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Marketplace ID (kebab-case, no spaces). Users see: `/plugin install tool@name` | `"acme-tools"` |
| `owner` | object | Maintainer info (`name` required, `email` optional) | |
| `plugins` | array | List of plugin entries | |

### Reserved Names (Cannot Use)

`claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `life-sciences`. Names impersonating official marketplaces also blocked.

## Optional Metadata

| Field | Type | Description |
|-------|------|-------------|
| `metadata.description` | string | Brief marketplace description |
| `metadata.version` | string | Marketplace version |
| `metadata.pluginRoot` | string | Base dir prepended to relative source paths (e.g., `"./plugins"`) |

## Plugin Entry — Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Plugin ID (kebab-case). Users see: `/plugin install name@marketplace` |
| `source` | string\|object | Where to fetch plugin (see `plugin-marketplace-sources.md`) |

## Plugin Entry — Optional Metadata

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Brief plugin description |
| `version` | string | Plugin version |
| `author` | object | Author info (`name` required, `email` optional) |
| `homepage` | string | Plugin docs URL |
| `repository` | string | Source code URL |
| `license` | string | SPDX license ID (MIT, Apache-2.0) |
| `keywords` | array | Discovery/categorization tags |
| `category` | string | Plugin category |
| `tags` | array | Searchability tags |
| `strict` | boolean | Default `true`: merges with plugin.json. `false`: marketplace entry defines plugin entirely |

## Plugin Entry — Component Configuration

| Field | Type | Description |
|-------|------|-------------|
| `commands` | string\|array | Custom paths to command files/dirs |
| `agents` | string\|array | Custom paths to agent files |
| `hooks` | string\|object | Hooks config or path to hooks file |
| `mcpServers` | string\|object | MCP server configs or path |
| `lspServers` | string\|object | LSP server configs or path |

## Minimal Example

```json
{
  "name": "my-plugins",
  "owner": { "name": "Your Name" },
  "plugins": [{
    "name": "review-plugin",
    "source": "./plugins/review-plugin",
    "description": "Adds a review skill for quick code reviews"
  }]
}
```

## Full Example

```json
{
  "name": "company-tools",
  "owner": { "name": "DevTools Team", "email": "devtools@example.com" },
  "metadata": { "description": "Internal dev tools", "version": "1.0.0", "pluginRoot": "./plugins" },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0",
      "author": { "name": "DevTools Team" }
    },
    {
      "name": "deployment-tools",
      "source": { "source": "github", "repo": "company/deploy-plugin" },
      "description": "Deployment automation tools"
    }
  ]
}
```
