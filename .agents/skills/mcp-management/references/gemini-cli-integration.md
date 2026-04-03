# Gemini CLI Integration Guide

## Model Configuration

Read model from `.claude/.ck.json`: `gemini.model` (default: `gemini-3-flash-preview`)

## ⚠️ CRITICAL: Use Stdin Piping, NOT -p Flag

The `-p` flag is **deprecated** and skips MCP server initialization, causing tools to be unavailable:

```bash
# ❌ WRONG - Deprecated -p flag skips MCP connections!
gemini -y -m <gemini.model> -p "Take a screenshot"
# Also wrong: Using --model instead of -m
gemini -y -p "Take a screenshot" --model gemini-3-flash-preview

# ✅ CORRECT - This initializes MCP servers
echo "Take a screenshot" | gemini -y -m <gemini.model>
```

**Why**: The `-p` flag runs in "quick mode" and bypasses MCP server connection initialization. Always use stdin piping (echo + pipe) to ensure MCP tools are available.

## Overview

Gemini CLI provides automatic MCP tool discovery and execution via natural language prompts. This is the recommended primary method for executing MCP tools.

## Installation

```bash
npm install -g gemini-cli
```

Verify installation:
```bash
gemini --version
```

## Configuration

### Symlink Setup

Gemini CLI reads MCP servers from `.gemini/settings.json`. Create a symlink to `.claude/.mcp.json`:

```bash
# Create .gemini directory
mkdir -p .gemini

# Create symlink (Unix/Linux/macOS)
ln -sf .claude/.mcp.json .gemini/settings.json

# Create symlink (Windows - requires admin or developer mode)
mklink .gemini\settings.json .claude\.mcp.json
```

### Security

Add to `.gitignore`:
```
.gemini/settings.json
```

This prevents committing sensitive API keys and server configurations.

## Usage

### Basic Syntax

```bash
# IMPORTANT: Use stdin piping, NOT -p flag (deprecated, skips MCP init)
echo "<prompt>" | gemini [flags]
```

### Essential Flags

- `-y`: Skip confirmation prompts (auto-approve tool execution)
- `-m <model>`: Model selection
  - `gemini-3-flash-preview` (fast, recommended for MCP)
  - `gemini-3-pro-preview` (balanced)
  - `gemini-pro` (high quality)

### Examples

**Screenshot Capture**:
```bash
echo "Take a screenshot of https://www.google.com.vn" | gemini -y -m <gemini.model>
```

**Memory Operations**:
```bash
echo "Remember that Alice is a React developer working on e-commerce projects" | gemini -y -m <gemini.model>
```

**Web Research**:
```bash
echo "Search for latest Next.js 15 features and summarize the top 3" | gemini -y -m <gemini.model>
```

**Multi-Tool Orchestration**:
```bash
echo "Search for Claude AI documentation, take a screenshot of the homepage, and save both to memory" | gemini -y -m <gemini.model>
```

**Browser Automation**:
```bash
echo "Navigate to https://example.com, click the signup button, and take a screenshot" | gemini -y -m <gemini.model>
```

## How It Works

1. **Configuration Loading**: Reads `.gemini/settings.json` (symlinked to `.claude/.mcp.json`)
2. **Server Connection**: Connects to all configured MCP servers
3. **Tool Discovery**: Lists all available tools from servers
4. **Prompt Analysis**: Gemini model analyzes the prompt
5. **Tool Selection**: Automatically selects relevant tools
6. **Execution**: Calls tools with appropriate parameters
7. **Result Synthesis**: Combines tool outputs into coherent response

## Advanced Configuration

### Trusted Servers (Skip Confirmations)

Edit `.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "trust": true
    }
  }
}
```

With `trust: true`, the `-y` flag is unnecessary.

### Tool Filtering

Limit tool exposure:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "includeTools": ["navigate_page", "screenshot"],
      "excludeTools": ["evaluate_js"]
    }
  }
}
```

### Environment Variables

Use `$VAR_NAME` syntax for sensitive data:

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "$BRAVE_API_KEY"
      }
    }
  }
}
```

## Troubleshooting

### Check MCP Status

```bash
gemini
> /mcp
```

Shows:
- Connected servers
- Available tools
- Configuration errors

### Verify Symlink

```bash
# Unix/Linux/macOS
ls -la .gemini/settings.json

# Windows
dir .gemini\settings.json
```

Should show symlink pointing to `.claude/.mcp.json`.

### Debug Mode

```bash
echo "Take a screenshot" | gemini --debug
```

Shows detailed MCP communication logs.

## Comparison with Alternatives

| Method | Speed | Flexibility | Setup | Best For |
|--------|-------|-------------|-------|----------|
| Gemini CLI | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | All tasks |
| Direct Scripts | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Specific tools |
| mcp-manager | ⭐ | ⭐⭐ | ⭐⭐⭐ | Fallback |

**Recommendation**: Use Gemini CLI as primary method, fallback to scripts/subagent when unavailable.

## Resources

- [Gemini CLI Documentation](https://geminicli.com/docs)
- [MCP Server Configuration](https://geminicli.com/docs/tools/mcp-server)
- [Tool Reference](https://geminicli.com/docs/tools/mcp-server/#tool-interaction)
