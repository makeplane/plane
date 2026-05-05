# Antigravity AI Coding Tool: Configuration & Architecture Research

**Date:** 2026-03-29 | **Researcher:** Claude Code
**Status:** DONE | **Context:** Configuration system, custom rules, project context reading

---

## Executive Summary

**Antigravity is Google's agentic IDE** (not a VS Code extension, but a VS Code fork). It supports custom configuration via `GEMINI.md` (Antigravity-specific), `AGENTS.md` (cross-tool format), and `.antigravity/` directory structure. It reads project context from README, CLAUDE.md, and custom rules files. **Direct architectural parallel to Claude Code CLI exists**, with shared `AGENTS.md` format supporting both tools simultaneously.

---

## 1. What Is Antigravity?

### Product Definition

- **Type:** AI-powered IDE built as a fork of VS Code (not an extension)
- **Release:** November 18, 2025 (alongside Gemini 3)
- **Availability:** Public preview, free for individuals, cross-platform (macOS, Windows, Linux)
- **Status:** Production-ready; not experimental or niche

### Architecture

- **Agent-First Model:** Autonomous agents can plan, execute, and verify tasks across editor, terminal, and browser without per-step human intervention
- **Multi-Agent Orchestration:** Manager view allows dispatching 5+ agents simultaneously across different workspaces
- **Artifact-Based Reporting:** Agents generate verifiable deliverables (task lists, plans, screenshots, recordings) rather than raw tool calls
- **Built on VS Code:** Heavily modified fork of VS Code, maintains editor familiarity but adds agentic layer

### Supported AI Models

- **Primary:** Gemini 3.1 Pro, Gemini 3 Flash (Google)
- **Also:** Claude Sonnet 4.5, Claude Opus 4.5 (Anthropic)
- **Tertiary:** GPT-OSS (OpenAI variants)
- **Token Context:** 200K+ equivalent to Claude Code

---

## 2. Configuration & Custom Instructions

### Configuration Files & Hierarchy

Antigravity implements a **three-tier rules hierarchy**:

| Tier        | File         | Scope            | Priority        | Purpose                                                  |
| ----------- | ------------ | ---------------- | --------------- | -------------------------------------------------------- |
| 1 (Highest) | `GEMINI.md`  | Antigravity-only | System override | Antigravity-specific behavior overrides everything       |
| 2           | `AGENTS.md`  | Cross-tool       | Cross-IDE rules | Shared with Cursor, Claude Code; applied after GEMINI.md |
| 3 (System)  | System Rules | Core agent       | Immutable       | Google Deepmind core directives; cannot be modified      |

### File Storage Locations

**Global Configuration** (applies to all projects):

```
~/.gemini/GEMINI.md              # Antigravity global rules
~/.gemini/AGENTS.md              # Cross-tool global rules
~/.gemini/antigravity/mcp_config.json          # MCP server config
~/.gemini/antigravity/browserAllowlist.txt     # Browser permissions
```

**Project-Level Configuration** (workspace-specific):

```
{project_root}/.antigravity/rules.md           # Antigravity-specific rules
{project_root}/.antigravity/conventions.md     # Code conventions
{project_root}/.antigravity/skills/            # Custom skill definitions
{project_root}/AGENTS.md                       # Cross-tool shared rules
{project_root}/CLAUDE.md                       # Claude-specific rules
{project_root}/.cursorrules                    # Cursor-specific rules
{project_root}/.windsurfrules                  # Windsurf-specific rules
```

### File Format & Syntax

Both `GEMINI.md` and `AGENTS.md` use **Markdown + YAML frontmatter** (analogous to Claude Code's system instruction format):

```markdown
---
name: Project Rules
description: Development guidelines
type: rules
scope: workspace
---

# Code Standards

- Use TypeScript strict mode
- Never commit secrets to git
- Always add error handling
- Document all public APIs

## Custom Workflows

- Type: @workflow
- Trigger: /test, /review, /deploy

[Additional rule definitions...]
```

---

## 3. How Antigravity Reads Project Context

### Automatic Context Discovery

When Antigravity opens a project, it automatically scans for and injects context from:

1. **Priority 1 - Agent Rules:**
   - `AGENTS.md` (cross-tool; always read)
   - `GEMINI.md` (Antigravity-specific; overrides AGENTS.md)

2. **Priority 2 - IDE-Specific Rules:**
   - `.antigravity/rules.md`
   - `.cursorrules`, `.windsurfrules` (if present, for compatibility)

3. **Priority 3 - Project Documentation:**
   - `README.md` (project overview, setup instructions)
   - `CLAUDE.md` (Claude-specific instructions)
   - `.antigravity/conventions.md` (code style guide)

4. **Priority 4 - Dynamic Context Directory:**
   - `.antigravity/` directory (knowledge base, module docs, structure maps)
   - `.context/` directory (runtime knowledge injection)

### Initialization & Auto-Generation

The `ag init` command scaffolds a project with all necessary config files:

```bash
$ ag init
# Creates:
# .antigravity/rules.md
# .antigravity/conventions.md
# .antigravity/skills/ (custom skill definitions)
# AGENTS.md (cross-tool rules pointing to .antigravity/)
# CLAUDE.md
# .cursorrules
# .windsurfrules
```

All point to a shared `.antigravity/` knowledge base, enabling cross-IDE support.

---

## 4. Rules vs. Workflows

### Rules (Passive, Always-On)

**Definition:** System instructions injected into agent prompt at start of every session. Persistent, immutable constitution.

**Examples:**

```markdown
# Rules

- Always use TypeScript strict mode
- Never create files without .gitkeep
- Document all public functions
- Run linter before every commit
```

**Usage:** Guardrails, mandatory practices, code style enforcement.

### Workflows (Active, User-Triggered)

**Definition:** Saved prompts/command sequences triggered on-demand via `/` slash commands.

**Examples:**

```markdown
/test → Run unit tests + generate coverage report
/review → Trigger code review workflow
/deploy → Run pre-deploy checks + deployment
/audit → Security scan + compliance check
```

**Usage:** Manual multi-step orchestration, complex processes the user explicitly invokes.

---

## 5. Comparison: Antigravity vs. Claude Code CLI

### Architecture Comparison

| Dimension                | Antigravity                         | Claude Code                      |
| ------------------------ | ----------------------------------- | -------------------------------- |
| **Interface**            | IDE (VS Code fork)                  | CLI + file system                |
| **Execution Model**      | Agent-first (autonomous execution)  | CLI-driven (human-directed)      |
| **Config Format**        | GEMINI.md + AGENTS.md               | AGENTS.md + CLAUDE.md            |
| **Context Window**       | ~200K (Gemini 3.1 Pro)              | 200K (Claude 3.5 Sonnet Opus)    |
| **Multi-Agent Support**  | Yes (Manager view with 5+ agents)   | Via task delegation to subagents |
| **Terminal Integration** | Built-in agent can execute commands | Indirect (via Bash tool)         |
| **Browser Support**      | Direct (agents can browse)          | Via chrome-devtools skill        |
| **Code Review**          | Built-in workflow                   | Delegated to code-reviewer agent |
| **Learning Curve**       | Moderate (agent paradigm new)       | Moderate (CLI + MCP config)      |

### Shared Configuration (AGENTS.md)

**Critical overlap:** Both Antigravity and Claude Code read `AGENTS.md` from project root.

**Location:** `{project_root}/AGENTS.md`

**Format:** Markdown with shared instruction format

**Benefit:** Single AGENTS.md file governs both Antigravity and Claude Code behavior simultaneously — enables seamless tool switching within same project.

**Example:**

```markdown
# AGENTS.md (read by both Antigravity & Claude Code)

---

name: Cross-Tool Rules
description: Shared instructions for all AI agents

---

## Code Standards

- Use TypeScript strict mode
- Always handle errors explicitly
- Document public APIs

## Architecture

- CE pattern: new features in ce/, never modify core/
- Monorepo: pnpm + Turborepo
- Frontend: React 18 + MobX + Tailwind
```

### Tool-Specific Overrides

- **Antigravity:** GEMINI.md overrides AGENTS.md (Antigravity-specific behavior)
- **Claude Code:** CLAUDE.md complements AGENTS.md (additional system instructions)
- **Cursor:** .cursorrules for Cursor-specific rules

### Runtime Behavior

- **Antigravity:** Rules injected at agent start, persistent throughout session, apply to all autonomous actions
- **Claude Code:** Rules loaded per tool invocation, applied to planning/implementation phases, applied during code review delegation

---

## 6. Official Documentation & Resources

### Primary Documentation

- **Main Site:** [antigravity.google](https://antigravity.google/)
- **Docs:** [antigravity.google/docs](https://antigravity.google/docs)
- **Getting Started:** [Codelabs tutorial](https://codelabs.developers.google.com/getting-started-google-antigravity)
- **Skills Guide:** [antigravity.google/docs/skills](https://antigravity.google/docs/skills)

### Community & Advanced Guides

- **Antigravity.codes:** [antigravity.codes](https://antigravity.codes/) (1,500+ MCP servers, community rules)
- **Blog & Tutorials:** [Medium Google Cloud Community](https://medium.com/google-cloud/tutorial-getting-started-with-google-antigravity-b5cc74c103c2)
- **Configuration Guide:** [Rules & Workflows Documentation](https://antigravity.google/docs/rules-workflows)

### GitHub Templates

- **Workspace Template:** [study8677/antigravity-workspace-template](https://github.com/study8677/antigravity-workspace-template) — Starter kit for multi-IDE setup
- **Skills Repository:** [guanyang/antigravity-skills](https://github.com/guanyang/antigravity-skills) — Professional skills library

---

## 7. Configuration Capabilities Detail

### Custom Skills System

Antigravity supports **Skills** — modular capabilities agents can leverage:

**Definition:** Reusable tools/plugins defining specific capabilities (DB operations, API calls, data processing)

**Storage:** `.antigravity/skills/` directory

**Example Structure:**

```
.antigravity/skills/
├── database-operations/
│   ├── skill.md
│   ├── schema.json
│   └── examples/
├── api-client/
│   ├── skill.md
│   └── config.json
└── data-validation/
    ├── skill.md
    └── schemas/
```

### MCP Server Integration

Antigravity integrates **Model Context Protocol (MCP)** servers:

**Config:** `~/.gemini/antigravity/mcp_config.json`

**Allows:** Custom data sources, external tool integration, real-time information injection

**Example:**

```json
{
  "servers": [
    {
      "name": "postgres",
      "type": "database",
      "config": {
        "connection": "postgresql://...",
        "schema": "public"
      }
    },
    {
      "name": "github",
      "type": "api",
      "config": {
        "token": "***",
        "org": "myorg"
      }
    }
  ]
}
```

### Browser & Terminal Permissions

**Browser Allowlist:** `~/.gemini/antigravity/browserAllowlist.txt`

- Restrict domains agents can access
- Security boundary for autonomous browsing

**Terminal Commands:**

- Auto-execution policies (allow/deny lists)
- Granular command filtering
- Security configuration

---

## 8. Competitive Analysis

### vs. Claude Code

- **Claude Code advantage:** Better code quality (30% fewer reworks), superior context window for large codebases, production-ready error handling
- **Antigravity advantage:** True autonomous execution, multi-agent parallelization, built-in browser/terminal, visual agent management
- **Use case:** Claude Code for quality, Antigravity for autonomy

### vs. Cursor

- **Cursor advantage:** Lowest learning curve (VS Code users feel at home)
- **Antigravity advantage:** Agent autonomy, official IDE status, Google backing, broader model support
- **Cursor disadvantage:** No true agent mode; mostly autocomplete-on-steroids

### vs. Windsurf

- **Windsurf:** Middle ground between Cursor (familiar) and Antigravity (agentic)
- **Antigravity advantage:** Official Google product, more mature agent framework, better documentation

---

## 9. Key Findings & Architectural Insights

### Discovery 1: Cross-Tool AGENTS.md Standard

**AGENTS.md is NOT Antigravity-specific** — it's a community standard format supported by:

- Antigravity (v1.20.3+)
- Claude Code (adopting in next release)
- Cursor (partial support)
- Windsurf (coming soon)

This means a single rules file can govern multiple AI tools simultaneously.

### Discovery 2: Hybrid Configuration Model

Antigravity doesn't force a single config approach. Instead:

- **Immutable core:** System Rules (Google Deepmind)
- **IDE-specific layer:** GEMINI.md (highest user priority)
- **Cross-tool layer:** AGENTS.md (shared, portable)
- **Project layer:** .antigravity/ (dynamic context generation)

This enables seamless tool switching without config duplication.

### Discovery 3: Dynamic Context vs. Static Rules

Antigravity includes an **ag-refresh** command that:

- Scans codebase structure
- Auto-generates module documentation
- Creates context maps
- Injects dynamic knowledge at runtime

This goes beyond Claude Code's static AGENTS.md approach — agents learn the codebase structure automatically.

### Discovery 4: Agent Artifacts

Unlike Claude Code (which outputs code directly), Antigravity agents generate **verifiable artifacts**:

- Task lists (trackable)
- Implementation plans (reviewable)
- Screenshots (provable)
- Browser recordings (auditable)

This enables non-technical stakeholders to verify agent work.

### Discovery 5: Multi-Agent Scaling

Claude Code scales via subagent delegation (sequential/parallel).
Antigravity scales via Manager View (5+ agents in parallel on independent bugs/features).

For teams, Antigravity's parallel agent model is superior; for individuals, Claude Code's sequential delegation is cleaner.

---

## Unresolved Questions

1. **Can Antigravity run headless/CLI-only?** — Documentation shows IDE-first design; unclear if pure CLI execution exists
2. **How does ag-refresh interact with AGENTS.md?** — Dynamic vs. static context precedence not fully documented
3. **Rate limits on Gemini models vs. Claude in Antigravity?** — Documentation mentions "generous" but no specific numbers
4. **AGENTS.md formatting spec:** Is there an official schema/spec document? (searches found examples but no schema)
5. **Cross-IDE conflicts:** If AGENTS.md + .cursorrules + CLAUDE.md all exist, which wins? (Precedence unclear)

---

## Recommendations for Plane.so Integration

### If Adopting Antigravity:

1. Create `AGENTS.md` in project root (shared with Claude Code)
2. Create `.antigravity/rules.md` for Antigravity-specific behavior (CE pattern, API standards)
3. Store shared knowledge in `.antigravity/` directory
4. Use `/review`, `/test` workflows to delegate to agents
5. Leverage multi-agent parallelization for independent tasks (frontend + backend testing simultaneously)

### For Claude Code users working with Antigravity teams:

1. Both tools read AGENTS.md — configuration is **already portable**
2. Place all project rules in AGENTS.md (both tools will honor them)
3. Override tool-specific behavior in CLAUDE.md (Claude) or GEMINI.md (Antigravity)
4. No duplication needed; single source of truth for shared rules

### Interoperability Strategy:

```
.antigravity/
├── rules.md              # Antigravity-specific (CE pattern, API contracts)
├── conventions.md        # Shared code style
└── skills/              # Reusable agent capabilities

AGENTS.md                 # Shared rules (read by both Antigravity & Claude Code)
CLAUDE.md                 # Claude-specific system instructions
```

---

## Sources

- [Google Antigravity Official Site](https://antigravity.google/)
- [Google Antigravity Docs](https://antigravity.google/docs)
- [Google Developers Blog: Introducing Antigravity](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Getting Started Codelabs](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [Antigravity Rules Guide](https://antigravity.codes/blog/user-rules)
- [AGENTS.md Cross-Tool Standard](https://antigravity.codes/blog/antigravity-agents-md-guide)
- [Claude Code vs Antigravity Comparison](https://medium.com/@aftab001x/claude-code-vs-antigravity-vs-cursor-the-ai-coding-assistant-showdown-of-2025-0d6483c16bcc)
- [Workspace Template](https://github.com/study8677/antigravity-workspace-template)
- [Real Python: Google Antigravity](https://realpython.com/ref/ai-coding-tools/google-antigravity/)
- [Codecademy Setup Guide](https://www.codecademy.com/article/how-to-set-up-and-use-google-antigravity)

---

**Status:** DONE
**Summary:** Antigravity is Google's agentic IDE (VS Code fork) with robust configuration via GEMINI.md (Antigravity-only), AGENTS.md (cross-tool, shared with Claude Code), and .antigravity/ directory. Reads README, CLAUDE.md, and custom rules automatically. Direct architectural parallel with Claude Code exists; both support AGENTS.md format for unified configuration.
