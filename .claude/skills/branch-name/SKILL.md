---
name: branch-name
description: Use when starting a new branch or renaming an existing one — produces a branch name in the format `<type>/<work-item-id>-<short-description>` that's compatible with the create-pr skill's work item ID extraction.
user_invocable: true
---

# Branch Naming

Create branch names that follow the convention `<type>/<work-item-id>-<short-description>`, where the work item ID can be cleanly extracted later (e.g., by the create-pr skill).

## Format

```
<type>/<work-item-id>-<short-description>
```

- All lowercase, hyphen-separated
- Work item ID stays in its original form but lowercased (e.g., `SILO-1146` → `silo-1146`)
- Short description is 2–5 words in kebab-case, focused on the _what_, not the _how_

## Workflow

1. **Determine the type** based on the work being done:
   - `feat` — new functionality
   - `fix` — bug fix
   - `chore` — tooling, deps, config, non-user-facing housekeeping
   - `refactor` — restructuring without behavior change
   - `docs` — documentation only
   - `perf` — performance improvement

2. **Determine the work item ID**:
   - If the user gives one, use it
   - If they reference a Plane work item (e.g., a URL or title), extract the ID
   - If none exists, ask the user — don't invent one

3. **Write the short description**:
   - 2–5 words in kebab-case
   - Describe the outcome, not the implementation (`add-app-tile-visibility`, not `update-tile-component`)
   - Skip filler words (`the`, `a`, `for`)

4. **Assemble and create the branch**:

```
   git checkout -b <type>/<work-item-id-lowercased>-<short-description>
```

5. **Return the branch name** to the user.

## Examples

```
fix/silo-1146-relative-config-urls
feat/web-1234-app-tile-visibility
chore/web-2201-bump-eslint
refactor/silo-980-extract-auth-middleware
docs/web-1500-pr-template-update
perf/silo-1310-cache-workspace-lookup
```

## Common Mistakes

- Putting the work item ID at the end instead of after the type (breaks extraction)
- Using underscores or camelCase instead of hyphens
- Uppercasing the work item ID inside the branch name (it should be lowercase here, uppercased only when used as the PR title prefix)
- Writing a long, narrative description — keep it scannable
- Omitting the work item ID when one exists in Plane
- Using a type that won't match the eventual PR type (pick the type you'd use in the PR title)
