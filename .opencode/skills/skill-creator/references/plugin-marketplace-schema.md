# Plugin Marketplace Schema

## Marketplace JSON Structure

```json
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "metadata": {
    "description": "Brief marketplace description",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [...]
}
```

## Required Fields

| Field     | Type   | Description                              | Example        |
|-----------|--------|------------------------------------------|----------------|
| `name`    | string | Marketplace identifier (kebab-case)      | `"acme-tools"` |
| `owner`   | object | Maintainer info (name required, email optional) |         |
| `plugins` | array  | List of available plugins                |                |

## Reserved Names

Cannot use: `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `life-sciences`. Names impersonating official marketplaces also blocked.

## Optional Metadata

| Field                  | Type   | Description                                    |
|------------------------|--------|------------------------------------------------|
| `metadata.description` | string | Brief marketplace description                  |
| `metadata.version`     | string | Marketplace version                            |
| `metadata.pluginRoot`  | string | Base directory for relative plugin source paths|

## Plugin Entry Schema

### Required Plugin Fields

| Field    | Type           | Description                                    |
|----------|----------------|------------------------------------------------|
| `name`   | string         | Plugin identifier (kebab-case)                 |
| `source` | string\|object | Where to fetch plugin (path, github, url)      |

### Optional Plugin Fields

| Field         | Type    | Description                                         |
|---------------|---------|-----------------------------------------------------|
| `description` | string  | Brief plugin description                            |
| `version`     | string  | Plugin version                                      |
| `author`      | object  | Plugin author (name required, email optional)       |
| `homepage`    | string  | Plugin homepage or docs URL                         |
| `repository`  | string  | Source code repository URL                          |
| `license`     | string  | SPDX license identifier (MIT, Apache-2.0, etc.)     |
| `keywords`    | array   | Tags for discovery and categorization               |
| `category`    | string  | Plugin category for organization                    |
| `tags`        | array   | Tags for searchability                              |
| `strict`      | boolean | If true (default), plugin needs own plugin.json     |

### Component Configuration Fields

| Field        | Type           | Description                            |
|--------------|----------------|----------------------------------------|
| `commands`   | string\|array  | Custom paths to command files/dirs     |
| `agents`     | string\|array  | Custom paths to agent files            |
| `hooks`      | string\|object | Hooks configuration or path            |
| `mcpServers` | string\|object | MCP server configurations or path      |
| `lspServers` | string\|object | LSP server configurations or path      |

## Example Plugin Entry

```json
{
  "name": "code-formatter",
  "source": "./plugins/formatter",
  "description": "Automatic code formatting on save",
  "version": "2.1.0",
  "author": { "name": "DevTools Team" },
  "license": "MIT",
  "keywords": ["formatting", "linting"],
  "strict": false
}
```
