---
name: ck:worktree
description: "Create, inspect, and clean isolated git worktrees. Use for feature isolation, worktree health audits, stale cleanup, and monorepo or submodule workflows."
user-invocable: true
when_to_use: "Invoke for isolated worktrees, stale cleanup, or worktree audits."
category: dev-tools
keywords: [worktree, parallel, monorepo, isolation]
argument-hint: "[feature-description] OR [project] [feature]"
metadata:
  author: claudekit
  version: "1.1.0"
---

# Git Worktree

Create an isolated git worktree for parallel feature development.

## Workflow

### Step 1: Get Repo Info

```bash
node .claude/skills/worktree/scripts/worktree.cjs info --json
```

Parse JSON response for: `repoType`, `baseBranch`, `projects`, `worktreeRoot`,
`worktreeRootSource`, `dirtyState`, `dirtyDetails`.

### Step 2: Detect Branch Naming Mode

**Check for exact branch name first:**
If caller provides a pre-formed branch name (contains uppercase letters, issue tracker keys like `ABC-1234`, forward slashes for multi-segment conventions like `user/type/feature`, or explicitly says "use this exact branch name"):
→ Use `--no-prefix` flag — skip Step 3, pass name directly as slug.
Examples:

- `"ND-1377-cleanup-docs"` → `--no-prefix` → branch `ND-1377-cleanup-docs`
- `"kai/feat/604-startup-option"` → `--no-prefix` → branch `kai/feat/604-startup-option`

**Otherwise, detect prefix from description:**

- "fix", "bug", "error", "issue" → `fix`
- "refactor", "restructure", "rewrite" → `refactor`
- "docs", "documentation", "readme" → `docs`
- "test", "spec", "coverage" → `test`
- "chore", "cleanup", "deps" → `chore`
- "perf", "performance", "optimize" → `perf`
- Default → `feat`

### Step 3: Convert to Slug

**Skip if `--no-prefix` was chosen in Step 2.**

"add authentication system" → `add-auth`
"fix login bug" → `login-bug`
Max 50 chars, kebab-case.

### Step 4: Handle Monorepo

If `repoType === "monorepo"` and project not specified, use AskUserQuestion:

```javascript
AskUserQuestion({
  questions: [
    {
      header: "Project",
      question: "Which project for the worktree?",
      options: projects.map((p) => ({ label: p.name, description: p.path })),
      multiSelect: false,
    },
  ],
});
```

### Step 5: Execute

**Monorepo:**

```bash
node .claude/skills/worktree/scripts/worktree.cjs create "<PROJECT>" "<SLUG>" --prefix <TYPE>
```

**Standalone:**

```bash
node .claude/skills/worktree/scripts/worktree.cjs create "<SLUG>" --prefix <TYPE>
```

**Options:**

- `--prefix` - Branch type: feat|fix|refactor|docs|test|chore|perf
- `--base <branch>` - Override auto-detected base branch (default: dev→develop→main→master)
- `--checkout-submodules` - Run `git submodule update --init --checkout --recursive` in the new worktree after create
- `--no-prefix` - Skip branch prefix and preserve original case and slashes (for Jira keys, multi-segment branches like `user/type/feature`)
- `--worktree-root <path>` - Override default location (only if needed)
- `--json` - JSON output
- `--dry-run` - Preview

### Step 6: Install Dependencies

Based on project context, run in background:

- `bun.lock` → `bun install`
- `pnpm-lock.yaml` → `pnpm install`
- `yarn.lock` → `yarn install`
- `package-lock.json` → `npm install`
- `poetry.lock` → `poetry install`
- `requirements.txt` → `pip install -r requirements.txt`
- `Cargo.toml` → `cargo build`
- `go.mod` → `go mod download`

## Commands

| Command  | Usage                        | Description                                                           |
| -------- | ---------------------------- | --------------------------------------------------------------------- |
| `create` | `create [project] <feature>` | Create worktree                                                       |
| `remove` | `remove <name-or-path>`      | Remove worktree                                                       |
| `info`   | `info`                       | Repo info with worktree location                                      |
| `list`   | `list`                       | List worktrees                                                        |
| `status` | `status`                     | Inspect worktree health, normalized paths, and base-branch divergence |
| `prune`  | `prune`                      | Clean stale worktree metadata (`--dry-run` supported)                 |

## JSON Output Fields

When using `--json`, the command surfaces these high-signal fields:

| Field                | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `baseBranch`         | Branch the worktree is based on                                   |
| `baseBranchSource`   | `"explicit"` (from `--base`) or `"auto-detected"`                 |
| `checkoutSubmodules` | Whether create will initialize submodules after checkout          |
| `currentWorktree`    | Current worktree health record from `status --json`               |
| `worktrees`          | Normalized worktree records from `list --json` or `status --json` |
| `entries`            | Prune output lines from `prune --json`                            |
| `worktreePath`       | Absolute path to the created worktree                             |
| `worktreeRootSource` | How location was determined                                       |

## Notes

- Script auto-detects superproject, monorepo, and standalone repos
- Default worktree location is smart: superproject > monorepo > sibling
- Use `--worktree-root` only to override defaults
- Use `--base` for long-lived variant branches (e.g., `main-dsl`) that diverge from auto-detected base
- `status` normalizes the main checkout path in submodule repos before reporting worktree health
- `prune --dry-run` is the safe first pass when auditing stale metadata
- Env templates (`.env*.example`) auto-copied with `.example` suffix removed

## Workflow Position

**Typically precedes:** `/ck:cook` (implement in worktree), `/ck:fix` (fix in worktree)
**Setup skill** — creates isolated environment before implementation.
