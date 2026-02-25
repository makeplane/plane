# MCP Configuration Guide

## Configuration File Structure

MCP servers are configured in `.opencode/.mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

## Common Server Configurations

### Memory Server

Store and retrieve key-value data:

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

### Filesystem Server

File operations with restricted access:

```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/allowed/path"
    ]
  }
}
```

### Brave Search Server

Web search capabilities:

```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "${BRAVE_API_KEY}"
    }
  }
}
```

### Puppeteer Server

Browser automation:

```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

## Environment Variables

Reference env vars with `${VAR_NAME}` syntax:

```json
{
  "api-server": {
    "command": "node",
    "args": ["server.js"],
    "env": {
      "API_KEY": "${MY_API_KEY}",
      "BASE_URL": "${API_BASE_URL}"
    }
  }
}
```

## Configuration Loading Order

Scripts check for config in this order:

1. `process.env` (runtime environment)
2. `.opencode/skills/mcp-management/.env`
3. `.opencode/skills/.env`
4. `.opencode/.env`

## Validation

Config must:
- Be valid JSON
- Include `mcpServers` object
- Each server must have `command` and `args`
- `env` is optional but must be object if present
