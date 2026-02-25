---
name: plans-kanban
description: View plans dashboard with progress tracking and timeline visualization. Use for kanban boards, plan status overview, phase progress, milestone tracking, project visibility.
---

# plans-kanban

Plans dashboard server with progress tracking and timeline visualization.

## ⚠️ Installation Required

**This skill requires npm dependencies.** Run one of the following:

```bash
# Option 1: Install via ClaudeKit CLI (recommended)
ck init  # Runs install.sh which handles all skills

# Option 2: Manual installation
cd .claude/skills/plans-kanban
npm install
```

**Dependencies:** `gray-matter`

Without installation, you'll get **Error 500** when viewing plan details.

## Purpose

Visual dashboard for viewing plan directories with:
- Progress tracking per plan
- Timeline/Gantt visualization
- Phase status indicators
- Activity heatmap

## Quick Start

```bash
# View plans dashboard
node .claude/skills/plans-kanban/scripts/server.cjs \
  --dir ./plans \
  --open

# Remote access (all interfaces)
node .claude/skills/plans-kanban/scripts/server.cjs \
  --dir ./plans \
  --host 0.0.0.0 \
  --open

# Background mode
node .claude/skills/plans-kanban/scripts/server.cjs \
  --dir ./plans \
  --background

# Stop all running servers
node .claude/skills/plans-kanban/scripts/server.cjs --stop
```

## Slash Command

Use `/kanban` for quick access:

```bash
/kanban plans/           # View plans dashboard
/kanban --stop           # Stop kanban server
```

## Features

### Dashboard View
- Plan cards with progress bars
- Phase status breakdown (completed, in-progress, pending)
- Last modified timestamps
- Issue and branch links
- Priority indicators

### Timeline Visualization
- Gantt-style timeline of plans
- Duration tracking
- Activity heatmap

### Design
- Glassmorphism UI with dark mode
- Responsive grid layout
- Warm accent colors

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dir <path>` | Plans directory | - |
| `--port <number>` | Server port | 3500 |
| `--host <addr>` | Host to bind (`0.0.0.0` for remote) | localhost |
| `--open` | Auto-open browser | false |
| `--background` | Run in background | false |
| `--stop` | Stop all servers | - |

## Architecture

```
scripts/
├── server.cjs               # Main entry point
└── lib/
    ├── port-finder.cjs      # Port allocation (3500-3550)
    ├── process-mgr.cjs      # PID management
    ├── http-server.cjs      # HTTP routing
    ├── plan-parser.cjs      # Plan.md parsing
    ├── plan-scanner.cjs     # Directory scanning
    ├── plan-metadata-extractor.cjs  # Rich metadata
    └── dashboard-renderer.cjs       # HTML generation

assets/
├── dashboard-template.html  # Dashboard HTML template
├── dashboard.css           # Styles
└── dashboard.js            # Client interactivity
```

## HTTP Routes

| Route | Description |
|-------|-------------|
| `/` or `/kanban` | Dashboard view |
| `/kanban?dir=<path>` | Dashboard for specific directory |
| `/api/plans` | JSON API for plans data |
| `/api/plans?dir=<path>` | JSON API for specific directory |
| `/assets/*` | Static assets |
| `/file/*` | Local file serving |

## Remote Access

When using `--host 0.0.0.0`, the server auto-detects your local network IP:

```json
{
  "success": true,
  "url": "http://localhost:3500/kanban?dir=...",
  "networkUrl": "http://192.168.2.75:3500/kanban?dir=...",
  "port": 3500
}
```

Use `networkUrl` to access from other devices on the same network.

## Plan Structure

The dashboard scans for directories containing `plan.md` files:

```
plans/
├── 251215-feature-a/
│   ├── plan.md              # Required - parsed for phases
│   ├── phase-01-setup.md
│   └── phase-02-impl.md
├── 251214-feature-b/
│   └── plan.md
└── templates/               # Excluded by default
```

## Troubleshooting

**Port in use**: Server auto-increments from 3500-3550

**No plans found**: Ensure directories contain `plan.md` files

**Remote access denied**: Use `--host 0.0.0.0` to bind all interfaces

**PID files**: Located at `/tmp/plans-kanban-*.pid`
