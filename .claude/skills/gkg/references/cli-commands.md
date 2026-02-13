# GKG CLI Commands

## gkg index

Index repositories into knowledge graph.

```bash
# Index current directory
gkg index

# Index specific path
gkg index /path/to/workspace

# With statistics output
gkg index --stats

# Save stats as JSON
gkg index --stats stats.json

# Verbose logging
gkg index -v

# Control thread count (default: CPU cores)
gkg index --threads 4
```

**Auto-detection**: Detects if path is workspace (multiple repos) or single repository.

**Output location**: `~/.gkg/{workspace_hash}/{project_hash}/`

## gkg server

Start HTTP server for API and MCP access.

```bash
# Start server (default: http://localhost:27495)
gkg server start

# Start with MCP endpoints
gkg server start --register-mcp

# Stop server
gkg server stop

# Check status
gkg server status
```

**Port**: 27495 (0x6b67 = "kg" in hex). Falls back to unused port if busy.

**Important**: Stop server before re-indexing: `gkg server stop`

## gkg remove

Remove indexed data.

```bash
# Remove entire workspace
gkg remove --workspace /path/to/workspace

# Remove single project
gkg remove --project /path/to/project --workspace-folder /path/to/workspace
```

## gkg clean

Clean orphaned or corrupted data.

```bash
# Clean all orphaned data
gkg clean

# Dry run (preview only)
gkg clean --dry-run
```

## Common Workflows

### Initial Setup
```bash
cd /my/project
gkg index --stats
gkg server start
```

### Re-index After Changes
```bash
gkg server stop
gkg index
gkg server start
```

### Multi-repo Workspace
```bash
# Index parent directory containing multiple repos
gkg index /path/to/workspace
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| High memory | Reduce `--threads` |
| Slow indexing | Increase `--threads` or use `-v` |
| Server conflict | Run `gkg server stop` first |
| Stale data | Run `gkg clean` |
