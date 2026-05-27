# Agent-Centric Design Rules

Rules for choosing what to expose and how to shape it when wrapping code for CLI + MCP consumption by AI agents.

## Select capabilities

Keep a capability if **at least one** is true:

- An agent can accomplish a user task by calling it
- It's a workflow step that is awkward or error-prone to express in prose
- It's idempotent or easily made so

Drop a capability if **all** are true:

- It's a thin passthrough over another capability
- It's purely internal plumbing
- Its output is too large to be useful in context

## Consolidate workflows

Bad: `list_items`, `get_item`, `check_quota`, `create_item` (4 tools, agent has to orchestrate).
Good: `create_item(name, …)` that internally checks quota, deduplicates by name, and returns the created record.

Rule: if the README's "how to use" says "first call X, then Y, then Z" — that's one tool, not three.

## Optimize for context

- Default responses are **concise**. Return IDs + names + status, not full payloads.
- Offer `format: "detailed"` / `--detailed` opt-in for full data.
- Paginate. Default page size small (10–25).
- Prefer names over IDs in responses: `{ "project": "acme-web" }` beats `{ "project_id": "prj_7f3c2…" }`.
- Truncate long fields with a `…` marker + length hint.

## Actionable errors

Every error must answer: what failed, why, and what to try next.

Bad:

```
Error: 400 Bad Request
```

Good:

```
Error: rate_limited
Message: Exceeded 60 requests/minute. Retry after 12s, or pass --concurrency 2.
```

Include an `error_code` machine field for agent branching.

## Safe vs mutating

- Read-only tools: no confirmation semantics, safe to call speculatively.
- Mutating tools: describe the mutation in the tool `description`; prefer `dry_run: true` support; return the diff/preview when dry-running.
- Destructive tools (`delete_*`): require an explicit `confirm: true` or a unique token returned from a preceding `plan_*` tool.

## Naming

- Tools: `verb_noun`, snake_case: `list_projects`, `create_project`, `search_logs`.
- CLI commands: `noun verb` or `verb`, kebab-case: `project list`, `project create`, `search`.
- Flags: long-form kebab-case, short-form single-letter where universal (`-v`, `-h`).

## Idempotency

Where possible:

- Creates accept a client-supplied idempotency key
- Updates are PATCH-shaped (only send changed fields)
- Deletes succeed if the target is already absent

## Output shape

JSON output (default when `--json` or MCP structured content):

```json
{
  "ok": true,
  "data": { … },
  "warnings": [],
  "next_actions": ["optional hints for the agent"]
}
```

Errors:

```json
{
  "ok": false,
  "error": { "code": "rate_limited", "message": "…", "retry_after_s": 12 }
}
```
