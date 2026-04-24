# Plugin Marketplaces Overview

Plugin marketplace = catalog distributing Claude Code extensions across teams/communities.
Provides centralized discovery, version tracking, automatic updates, multiple source types.

## Creation & Distribution Flow

1. **Create plugins** — commands, agents, hooks, MCP servers, LSP servers (see [Plugins docs](https://code.claude.com/docs/en/plugins.md))
2. **Create marketplace file** — `.claude-plugin/marketplace.json` listing plugins + sources
3. **Host marketplace** — push to GitHub/GitLab/git host
4. **Share** — users add via `/plugin marketplace add`, install via `/plugin install`

Updates: push changes to repo → users refresh via `/plugin marketplace update`.

## Directory Structure

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json        # Marketplace catalog (required)
└── plugins/
    └── review-plugin/
        ├── .claude-plugin/
        │   └── plugin.json     # Plugin manifest
        └── skills/
            └── review/
                └── SKILL.md    # Skill definition
```

## Walkthrough: Local Marketplace

```bash
# 1. Create structure
mkdir -p my-marketplace/.claude-plugin
mkdir -p my-marketplace/plugins/review-plugin/.claude-plugin
mkdir -p my-marketplace/plugins/review-plugin/skills/review

# 2. Create skill (SKILL.md), plugin manifest (plugin.json), marketplace catalog (marketplace.json)

# 3. Add and install
/plugin marketplace add ./my-marketplace
/plugin install review-plugin@my-plugins

# 4. Test
/review
```

## Plugin Installation Behavior

Plugins copied to cache location on install. Cannot reference files outside plugin directory with `../`.
Workarounds: symlinks (followed during copying) or restructure so shared files are inside plugin source path.

## User Commands

| Command | Purpose |
|---------|---------|
| `/plugin marketplace add <source>` | Add marketplace |
| `/plugin marketplace update` | Refresh marketplace |
| `/plugin install <name>@<marketplace>` | Install plugin |
| `/plugin validate .` | Validate marketplace JSON |
| `claude plugin validate .` | CLI validation |

## Validation & Testing

```bash
# Validate marketplace JSON
claude plugin validate .
# or within Claude Code:
/plugin validate .

# Test locally before distribution
/plugin marketplace add ./my-local-marketplace
/plugin install test-plugin@my-local-marketplace
```

## Related References

- **Schema:** `references/plugin-marketplace-schema.md`
- **Sources:** `references/plugin-marketplace-sources.md`
- **Hosting:** `references/plugin-marketplace-hosting.md`
- **Troubleshooting:** `references/plugin-marketplace-troubleshooting.md`

## Official Documentation

- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)
- [Discover Plugins](https://code.claude.com/docs/en/discover-plugins.md)
- [Create Plugins](https://code.claude.com/docs/en/plugins.md)
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference.md)
- [Plugin Settings](https://code.claude.com/docs/en/settings.md#plugin-settings)
