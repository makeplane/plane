# Research Report: Google Antigravity Custom Skills & Workflows Support

**Report Date:** 2026-03-02
**Researcher:** Claude Code
**Context:** Comparative analysis of Antigravity vs Claude Code CLI for custom skills/workflows

---

## Executive Summary

Google Antigravity (Google's AI-powered IDE powered by Gemini 3 Pro) supports custom skills and workflows in a **Markdown + YAML frontmatter format** stored in `.agent/` directories. Key finding: **Antigravity's architecture is conceptually similar to Claude Code CLI but with important differences in implementation and capability scope.**

---

## 1. Custom Slash Commands Support

### Antigravity: YES, with limitations

Antigravity **supports slash commands** that trigger workflows and skills:

- **Trigger Pattern:** Type `/workflow-name` to invoke a workflow
- **File Detection:** Agent looks for `.agent/workflows/workflow-name.md`
- **Smart Detection:** If user asks a question (e.g., "How do I test?"), agent automatically checks if relevant workflow exists
- **Status:** Known issue reported Jan 2026 — slash command menu not showing in UI, but workflows accessible via "…" dropdown menu

### Claude Code CLI: YES, extensive

Claude Code supports `/plan`, `/cook`, `/plan:validate`, `/git` and other custom slash commands invoked via **Skill tool** mechanism.

### Difference

Antigravity's slash commands are simpler — they're just workflow names mapped to files. Claude Code CLI has a **Skill tool infrastructure** that allows more sophisticated command routing and parameter passing.

---

## 2. `.agent/` Directory Structure

### Antigravity Structure

```
.agent/
├── skills/                    # Custom skill packages
│   ├── git-committer/
│   │   ├── SKILL.md          # Required: skill definition
│   │   ├── scripts/          # Optional: Python/Bash/Node scripts
│   │   └── references/       # Optional: documentation/templates
│   ├── another-skill/
│   │   └── SKILL.md
│   └── ...
└── workflows/                # Custom workflows
    ├── implement-feature.md   # Markdown files with YAML frontmatter
    ├── plan-feature.md
    ├── code-review.md
    └── ...
```

**Dual Scope Support:**

- **Workspace Scope:** `<workspace-root>/.agent/skills/` — available within project only
- **Global Scope:** `~/.gemini/antigravity/skills/` — available across all projects
- **Precedence:** Workspace-specific version overrides global if same name exists

### Claude Code CLI Structure

```
.claude/
├── skills/
│   ├── cook/                 # Skill directories with scripts
│   ├── plan/
│   └── ...
├── rules/                    # Development rules & workflows
│   ├── primary-workflow.md
│   ├── development-rules.md
│   └── ...
└── config/
    └── ...
```

**Key Difference:** Claude Code uses **broader organizational categories** (rules, config, skills) vs Antigravity's focused skills/workflows split.

---

## 3. Workflow Definition Format

### Antigravity Workflow Format

**File:** `.agent/workflows/my-workflow.md`

```yaml
---
description: When to use this workflow and what it accomplishes.
---

# Workflow Title

## Overview
Clear statement of workflow purpose.

## Steps
1. First step
2. Second step with code block:
   \`\`\`bash
   echo "Command here"
   \`\`\`
3. Third step
```

**Key Fields:**

- **description** (mandatory): Trigger phrase for agent to recognize relevance
- **Steps:** Numbered list with inline code blocks

**Turbo Annotations (auto-execution):**

- `// turbo` — auto-run this single step (applies only to run_command calls)
- `// turbo-all` — auto-run ALL steps in workflow that involve run_command tool

### Antigravity SKILL.md Format

**File:** `.agent/skills/my-skill/SKILL.md`

```yaml
---
name: git-committer
description: Formats git commit messages using Conventional Commits. Trigger when user asks to "commit", "save changes", "push changes", or "prepare a message".
---

# Git Committer

## Use this skill when
- User wants to commit code with proper git commit format
- Creating conventional commit messages
- Following commit standards

## Do not use this skill when
- User is already specifying exact commit message format
- Doing interactive rebases
- Merging branches

## Instructions
1. Check the current git status
2. Analyze staged changes
3. Generate commit message following Conventional Commits format
4. Suggest to user for approval

## Examples
Input: "I've staged my changes, can you commit?"
Output: Generates commit message like "feat: add user authentication module"
```

**Key Fields:**

- **name**: Unique identifier (lowercase with hyphens)
- **description**: Trigger phrase for agent relevance detection
- **Use this skill when**: Conditions for usage
- **Do not use this skill when**: Constraints
- **Instructions**: Step-by-step logic
- **Examples**: Few-shot input/output pairs (teaches LLM by example)

### Key Difference

**Workflows:** Sequential automation procedures (like shell scripts with steps)
**Skills:** LLM-intelligently triggered capabilities with examples (like prompt templates with conditions)

---

## 4. Custom Prompts/Skills Invocation

### Antigravity Mechanism

**Intelligent Trigger (No explicit slash command needed):**

```
User: "How do I implement a new feature?"
↓
Agent: Scans .agent/workflows/ + .agent/skills/
↓
Agent: Finds implement-feature.md (description matches user intent)
↓
Agent: Uses view_file tool to read .agent/workflows/implement-feature.md
↓
Agent: Follows workflow steps
```

**Explicit Slash Command:**

```
User: /implement-feature
↓
Agent: Looks for .agent/workflows/implement-feature.md
↓
Executes if found
```

**Status:** Slash command UI broken (Jan 2026), but functionality works via explicit invocation or smart detection.

### Antigravity Scope of Skills

**Skills only for what agent itself can do:**

- Code analysis
- File manipulation
- Command execution
- LLM-based reasoning

**Cannot define:**

- New tools (like custom Bash/Python executables that agent calls)
- External service integrations beyond what Gemini 3 Pro can handle
- Complex tool routing (agent decides tool usage based on description alone)

### Claude Code Advantage

Claude Code's `/skill` tool mechanism allows:

- Parameterized skill invocation
- Explicit skill name routing
- Skills can execute Python scripts or bash scripts
- More control over execution flow

---

## 5. File Format Standards

### Antigravity Standards

| Component           | Format                             | Required | Notes                                  |
| ------------------- | ---------------------------------- | -------- | -------------------------------------- |
| Skill Definition    | `SKILL.md` in folder               | Yes      | Uses YAML frontmatter + Markdown body  |
| Workflow Definition | `.md` files in `.agent/workflows/` | Yes      | Uses YAML frontmatter + Markdown steps |
| Scripts             | Python, Bash, Node                 | Optional | In `skills/my-skill/scripts/`          |
| References          | Plain text, `.md` docs             | Optional | In `skills/my-skill/references/`       |

### YAML Frontmatter Example

**Workflow:**

```yaml
---
description: Plan a new feature implementation step-by-step
---
```

**Skill:**

```yaml
---
name: feature-planner
description: Helps plan feature implementation with architecture and milestones. Use when asked to "plan", "design", "architect".
---
```

### File Naming Convention

- **Workflows:** `kebab-case.md` (e.g., `implement-feature.md`, `code-review.md`)
- **Skills:** Folder name in `kebab-case` with `SKILL.md` inside
- **Scripts:** `kebab-case.py` or `kebab-case.sh`

---

## Comparative Analysis

| Feature                   | Antigravity                           | Claude Code CLI                              |
| ------------------------- | ------------------------------------- | -------------------------------------------- |
| **Slash Commands**        | Yes (workflow files)                  | Yes (Skill tool routing)                     |
| **Directory Structure**   | `.agent/skills/`, `.agent/workflows/` | `.claude/skills/`, `.claude/rules/`          |
| **Workflow Triggers**     | Smart detection + explicit `/name`    | Explicit `/skill-name`                       |
| **Skill Format**          | SKILL.md in folder                    | Python scripts in folder                     |
| **Workflow Format**       | Markdown with YAML frontmatter        | Markdown with YAML frontmatter               |
| **Auto-Run Commands**     | `// turbo`, `// turbo-all`            | Depends on skill implementation              |
| **Global vs Workspace**   | Both supported                        | Not explicitly documented                    |
| **Scope of Skills**       | LLM reasoning + file I/O              | Python execution + bash + special Skill tool |
| **Dual Scope Precedence** | Workspace overrides global            | Only workspace `.claude/` mentioned          |

---

## Implementation Insights

### What Antigravity Does Well

1. **Progressive Disclosure:** Skills only loaded when relevant (saves context)
2. **Intelligent Detection:** Doesn't require slash command — agent finds workflows via semantic matching
3. **Standardized Format:** YAML + Markdown is familiar to developers
4. **Examples in Skills:** Few-shot learning via Examples section teaches LLM behavior

### What Antigravity Lacks

1. **Parameter Passing:** No way to pass arguments to workflows (except through user text)
2. **Skill Chaining:** Skills can't call other skills directly
3. **Tool Customization:** Can't define custom tools/CLIs that skills invoke
4. **Conditional Execution:** No if/else branching in workflows
5. **Error Handling:** Limited error recovery in workflows
6. **Slash Command UI:** Currently broken (v1.0, as of Jan 2026)

### What Claude Code CLI Does Better

1. **Skill Tool Mechanism:** Explicit skill routing with parameter support
2. **Python Execution:** Skills can run arbitrary Python code
3. **Tool Integration:** Skills can invoke bash commands, git, etc.
4. **Layered Configuration:** Rules + workflows + skills all discoverable
5. **Token Efficiency:** Multiple agents (researcher, planner, tester) optimize context usage

---

## Recommendations for Your Use Case

### If Migrating from Claude Code to Antigravity

**Challenges:**

- Workflows can't execute Python scripts directly (unlike Claude Code `/cook` skill)
- No parameter passing mechanism
- Slash commands currently broken in UI
- Workflows are sequential only (no branching)

**Workarounds:**

1. **Create Skills for complex logic:** Use Skill's YAML format + script folder instead of Workflow for anything with branching
2. **Embed commands in workflows:** Use markdown code blocks with `// turbo` for auto-execution
3. **Use descriptions strategically:** Craft skill descriptions to trigger on intent (e.g., "Use when asked to plan, design, architect")
4. **Accept limitations:** Workflows are best for simple sequential procedures

### Replicating Your 3 Workflows in Antigravity

**File locations needed:**

```
.agent/
├── workflows/
│   ├── implement-feature.md      # Maps to your existing file
│   ├── plan-feature.md           # Maps to your existing file
│   └── code-review.md            # Maps to your existing file
└── skills/
    ├── feature-planner/          # For complex planning logic
    │   ├── SKILL.md
    │   └── scripts/
    └── code-reviewer/            # For review logic
        ├── SKILL.md
        └── scripts/
```

**Format conversion needed:**

- Add YAML frontmatter to your existing `.md` files
- Move complex Python logic into `skills/my-skill/scripts/` folder
- Add Examples section to SKILL.md files

---

## Unresolved Questions

1. **Slash Command Status:** When will the slash command UI be fixed in Antigravity? Current workaround is "…" dropdown menu.
2. **Parameter Passing:** Is there a planned feature for passing arguments to workflows (not yet documented)?
3. **Skill Chaining:** Can skills invoke other skills? Not documented in current sources.
4. **Conditional Workflows:** Will Antigravity support if/else branching in workflows?
5. **Global Skill Priority:** When workspace and global skills have same name, is precedence consistent across all Antigravity versions?

---

## Sources

- [Getting Started with Google Antigravity | Google Codelabs](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [How to Build Custom Skills in Google Antigravity: 5 Practical Examples | Google Cloud - Community](https://medium.com/google-cloud/tutorial-getting-started-with-antigravity-skills-864041811e0d)
- [Build with Google Antigravity, our new agentic development platform - Google Developers Blog](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Authoring Google Antigravity Skills | Google Codelabs](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)
- [How to Create AI Agent Skills in Google Antigravity & VS Code| Sabbirz | Blog](https://www.sabbirz.com/blog/how-to-create-ai-agent-skills-in-google-antigravity-vs-code)
- [How to Set Up and Use Google Antigravity | Codecademy](https://www.codecademy.com/article/how-to-set-up-and-use-google-antigravity)
- [The slash command(workflows) doesn't trigger - Google Antigravity - Google AI Developers Forum](https://discuss.ai.google.dev/t/the-slash-command-workflows-doesnt-trigger/116253)
- [Agents not reading workflow when directed with slash commands - Google Antigravity - Google AI Developers Forum](https://discuss.ai.google.dev/t/agents-not-reading-workflow-when-directed-with-slash-commands/115448)
- [GitHub - study8677/antigravity-workspace-template: 🪐 The ultimate starter kit for Google Antigravity IDE](https://github.com/study8677/antigravity-workspace-template)
- [Advanced Antigravity Mastery: Rules, MCPs, Workflows, and Agent Mode](https://javascript.plainenglish.io/advanced-antigravity-mastery-rules-mcps-workflows-and-agent-mode-8d2081fe64b2)
- [Skills Made Easy with Google Antigravity and Gemini CLI](https://medium.com/google-cloud/skills-made-easy-with-google-antigravity-and-gemini-cli-5435139b0af8)
- [Antigravity Workflows: How to Create Your Own Automation Recipes | Antigravity.codes](https://antigravity.codes/blog/workflows)
- [GitHub - guanyang/antigravity-skills](https://github.com/guanyang/antigravity-skills)
