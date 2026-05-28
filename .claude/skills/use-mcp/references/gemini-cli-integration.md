# Gemini CLI Integration Guide

## Model Configuration

Read model from `.claude/.ck.json`: `gemini.model` (default: `gemini-3-flash-preview`)

## ⚠️ CRITICAL: Stdin Piping for MCP Tasks

For **MCP tool execution**, use stdin piping — `--prompt`/`-p` has historically been reported to have issues with MCP server initialization in headless mode:

```bash
# ❌ AVOID for MCP tasks - historically reported MCP init issues in headless mode
gemini -y -m <gemini.model> -p "Take a screenshot"

# ✅ RECOMMENDED for MCP tasks - stdin piping as safer default
echo "Take a screenshot" | gemini -y -m <gemini.model>
```

**Why**: Stdin piping has been more reliable for MCP tool execution in practice. Use it as the safer default for MCP tasks.

**Note**: The `-p`/`--prompt` flag is NOT deprecated — it is the official headless mode flag and works correctly for non-MCP tasks (research, analysis). The MCP init concern is based on observed behavior, not official documentation.

## Overview

Gemini CLI provides automatic MCP tool discovery and execution via natural language prompts. This is the recommended primary method for executing MCP tools.

## Installation

```bash
npm install -g @google/gemini-cli
```

The published npm package is `@google/gemini-cli` (NOT `gemini-cli` — that name was unpublished on 2025-06-25). Latest verified version: `0.40.0` (2026-04-28).

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
# IMPORTANT: Use stdin piping for MCP tasks (headless --prompt mode may skip MCP server init)
echo "<prompt>" | gemini [flags]
```

### Essential Flags

- `-y` / `--yolo`: Skip confirmation prompts (auto-approve tool execution). Equivalent to `--approval-mode yolo`.
- `-m <model>`: Model selection
  - `gemini-2.5-flash` (stable, works on all account tiers)
  - `gemini-3-flash-preview` (fast, may require Google AI Pro/Ultra for CLI; default in `.ck.json` and upstream e2e tests)
  - `gemini-2.5-pro` (quality, may hit capacity limits)
- `-p` / `--prompt`: Headless mode (non-interactive). Official flag, NOT deprecated. Use stdin piping for MCP tasks (see warning above), `--prompt` for non-MCP research/analysis.

### Approval Modes (alternative to `-y`)

`--approval-mode <mode>` (added in v0.36+) is a finer-grained replacement for `-y`:

| Mode        | Behavior                                                   |
| ----------- | ---------------------------------------------------------- |
| `default`   | Prompt for each tool call (interactive only)               |
| `auto_edit` | Auto-approve edit tools, prompt for others                 |
| `yolo`      | Auto-approve everything (same as `-y` / `--yolo`)          |
| `plan`      | Read-only — no tools executed; useful for dry-run analysis |

```bash
echo "task" | gemini --approval-mode yolo -m <gemini.model>
```

### Output Formats (v0.36+)

`-o, --output-format <text|json|stream-json>` lets the CLI emit machine-readable output. Useful when scripting or piping into parsers:

```bash
echo "List all MCP tools" | gemini -y -m <gemini.model> -o json
```

### Deprecated Flags

- `--allowed-tools` is **deprecated** as of v0.36+. Replaced by the Policy Engine (`--policy <file>` and `--admin-policy <file>`). See https://geminicli.com/docs/core/policy-engine for migration.
- `--experimental-acp` was promoted to `--acp` (the experimental form still works but is deprecated).

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

## Error Handling

When gemini CLI fails, check exit code and output for known error markers:

```bash
RESULT=$(echo "task" | gemini -y -m <gemini.model> 2>&1)
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ] || echo "$RESULT" | grep -q "GaxiosError\|RESOURCE_EXHAUSTED\|MODEL_CAPACITY_EXHAUSTED\|PERMISSION_DENIED\|UNAUTHENTICATED"; then
  echo "[GEMINI_UNAVAILABLE] Falling back to script execution."
  # Use Pattern 2 (direct scripts in scripts/cli.ts) as the fallback path
else
  echo "$RESULT"
fi
```

Common failure modes:

- **429 `MODEL_CAPACITY_EXHAUSTED`**: Model overloaded. Try `gemini-2.5-flash` as fallback.
- **429 `RESOURCE_EXHAUSTED`**: Rate limit. Wait and retry or switch to script execution.
- **403 `PERMISSION_DENIED`**: Account tier doesn't support the model, or auth token expired.
- **401 `UNAUTHENTICATED`**: OAuth token invalid or expired. Re-authenticate with `gemini` interactive login.
- **Exit 142 (SIGALRM)**: Timeout from retry loop. Reduce prompt complexity or switch model.
- **Exit 1**: Generic API error (including 429 after internal retries exhaust). No dedicated exit code for quota errors.
- **Keychain error**: Cosmetic warning (`Cannot find module keytar.node`), does not affect functionality.
- **YOLO mode warning**: Cosmetic stderr noise, safe to ignore.

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

| Method         | Speed  | Flexibility | Setup  | Best For                                |
| -------------- | ------ | ----------- | ------ | --------------------------------------- |
| Gemini CLI     | ⭐⭐⭐ | ⭐⭐⭐      | ⭐⭐   | All tasks                               |
| Direct Scripts | ⭐⭐   | ⭐⭐⭐      | ⭐⭐⭐ | Specific tool, deterministic invocation |

**Recommendation**: Use Gemini CLI as primary method, fall back to `scripts/cli.ts call-tool` when unavailable.

## Resources

- [Gemini CLI Documentation](https://geminicli.com/docs)
- [MCP Server Configuration](https://geminicli.com/docs/tools/mcp-server)
- [Tool Reference](https://geminicli.com/docs/tools/mcp-server/#tool-interaction)
