# Stitch MCP Server Setup

Three options for connecting Google Stitch as an MCP server with Claude Code.

## Option A: API Key (Recommended for Most Users)

Simplest setup. No Google Cloud dependency.

### 1. Get API Key

1. Sign in at https://stitch.withgoogle.com
2. Go to Settings -> API Keys
3. Click "Generate New Key"
4. Copy `sk_...` key

### 2. Add to `.claude/.mcp.json`

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

### 3. Verify

Restart Claude Code. You should see Stitch tools available:
- `create_project` — Create new design project
- `generate_screen` — Generate UI from prompt
- `export_html` — Export as HTML/Tailwind
- `export_image` — Export screenshot

## Option B: Google Cloud (For GCP Users)

Uses gcloud credentials. Zero API key management.

### 1. Setup gcloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud beta services mcp enable stitch.googleapis.com
```

### 2. Add to `.claude/.mcp.json`

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "your-gcp-project-id"
      }
    }
  }
}
```

## Option C: Auto-Installer (Interactive)

Guided wizard, auto-detects environment.

```bash
npx stitch-mcp-auto
# Opens browser at http://localhost:8086
# Follow wizard to configure
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "AUTH_FAILED" on startup | Verify API key or re-run `gcloud auth login` |
| Tools not appearing | Restart Claude Code after config change |
| Timeout on generation | Stitch is processing; wait 10-30s for complex designs |
| "RATE_LIMITED" errors | Daily quota exceeded; wait until midnight UTC |

## MCP Config Location

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%AppData%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

For Claude Code CLI: use `.claude/.mcp.json` in project root (preferred for ClaudeKit).
