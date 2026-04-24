# Distribution Guide

## Current Distribution Model

### Individual Users
1. Download skill folder
2. Zip the folder
3. Upload to Claude.ai: Settings > Capabilities > Skills
4. Or place in Claude Code skills directory: `.claude/skills/`

### Organization-Level
- Admins deploy skills workspace-wide
- Automatic updates, centralized management

### Via API
- `/v1/skills` endpoint for managing skills programmatically
- Add to Messages API via `container.skills` parameter
- Version control through Claude Console
- Works with Claude Agent SDK for custom agents

| Use Case | Best Surface |
|---|---|
| End users interacting directly | Claude.ai / Claude Code |
| Manual testing during development | Claude.ai / Claude Code |
| Applications using skills programmatically | API |
| Production deployments at scale | API |
| Automated pipelines and agent systems | API |

## Recommended Approach

### 1. Host on GitHub
- Public repo for open-source skills
- Clear README with installation instructions (repo-level, NOT inside skill folder)
- Example usage and screenshots

### 2. Document in MCP Repo (if applicable)
- Link to skills from MCP documentation
- Explain value of using both together
- Provide quick-start guide

### 3. Create Installation Guide

```markdown
## Installing the [Service] Skill
1. Download: `git clone https://github.com/company/skills`
   Or download ZIP from Releases
2. Install: Claude.ai > Settings > Skills > Upload skill (zipped)
3. Enable: Toggle on the skill, ensure MCP server connected
4. Test: Ask Claude "[trigger phrase from description]"
```

## Packaging for Distribution

Run packaging script to validate and zip:

```bash
scripts/package_skill.py <path/to/skill-folder>
scripts/package_skill.py <path/to/skill-folder> ./dist  # custom output dir
```

Validates: frontmatter, naming, description (<200 chars), structure.
Creates: `skill-name.zip` with proper directory structure.

## Plugin Marketplaces

For marketplace distribution, see:
- `plugin-marketplace-overview.md` — Concepts and workflow
- `plugin-marketplace-schema.md` — JSON schema for marketplace.json
- `plugin-marketplace-sources.md` — Source types (path, GitHub, git)
- `plugin-marketplace-hosting.md` — Hosting options and auto-updates
- `plugin-marketplace-troubleshooting.md` — Common issues

## Positioning Your Skill

**Focus on outcomes:**
> "Enables teams to set up complete project workspaces in seconds instead of 30-minute manual setup."

**Include MCP story (if applicable):**
> "Our MCP server gives Claude access to your Linear projects. Our skills teach Claude your sprint planning workflow. Together: AI-powered project management."
