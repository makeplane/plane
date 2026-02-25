# Plugin Marketplace Overview

Build and host plugin marketplaces to distribute Claude Code extensions across teams and communities.

## What is a Plugin Marketplace

A plugin marketplace is a catalog that lets you distribute plugins to others. Marketplaces provide:
- Centralized discovery
- Version tracking
- Automatic updates
- Support for multiple source types (git repositories, local paths, etc.)

## Creating & Distributing a Marketplace

1. **Create plugins**: Build plugins with commands, agents, hooks, MCP servers, or LSP servers
2. **Create marketplace file**: Define `marketplace.json` listing plugins and sources
3. **Host the marketplace**: Push to GitHub, GitLab, or another git host
4. **Share with users**: Users add with `/plugin marketplace add` and install individual plugins

## Directory Structure

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json       # Required: marketplace catalog
└── plugins/
    └── my-plugin/
        ├── .claude-plugin/
        │   └── plugin.json    # Plugin manifest
        └── skills/
            └── my-skill/
                └── SKILL.md
```

## Marketplace File Location

Create `.claude-plugin/marketplace.json` in repository root.

## User Commands

- Add marketplace: `/plugin marketplace add owner/repo` or `/plugin marketplace add ./local-path`
- Install plugin: `/plugin install plugin-name@marketplace-name`
- Update marketplace: `/plugin marketplace update`
- Validate: `/plugin validate .` or `claude plugin validate .`

## Related References

- Schema details: `references/plugin-marketplace-schema.md`
- Plugin sources: `references/plugin-marketplace-sources.md`
- Hosting & distribution: `references/plugin-marketplace-hosting.md`
- Troubleshooting: `references/plugin-marketplace-troubleshooting.md`

## Official Documentation

https://code.claude.com/docs/en/plugin-marketplaces.md
