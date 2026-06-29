# Phase 1: Template Catalog Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 1-Template Catalog Foundation
**Areas discussed:** Template payload structure, Custom template lifecycle, Built-in templates, Template list/write permissions

---

## Template Payload Structure

| Question | Options Considered | Selected |
|----------|--------------------|----------|
| How should template payloads be stored? | JSON payload with schema validation; Separate child models for each template section; Hybrid metadata model plus JSON detail payload | JSON payload with schema validation |
| Should template payloads include `schema_version` in Phase 1? | Required `schema_version`; No `schema_version` in v1; Internal-only version | Required `schema_version` |
| How should starter issues reference states, labels, modules, and cycles? | Internal payload keys; Display names; Array indexes/order | Internal payload keys |
| How strict should payload validation be? | Strict full validation; Moderate validation; Light shape-only validation | Strict full validation |

**User's choice:** `1` for all four questions.
**Notes:** Payloads should be flexible JSON but validated strictly before use.

---

## Custom Template Lifecycle

| Question | Options Considered | Selected |
|----------|--------------------|----------|
| How should delete/archive behavior work? | Soft deactivate/archive; Hard delete if unused and deactivate if used; Always hard delete | Soft deactivate/archive |
| Should edits affect projects already created from the template? | No effect on existing projects; No v1 sync but keep metadata for future manual sync; Automatically update old projects | No effect on existing projects |
| Should admins be able to copy a built-in template in Phase 1 API? | Add copy/duplicate endpoint; Not needed in Phase 1; Automatically clone built-ins for each workspace | Add copy/duplicate endpoint |
| Should custom template edits keep version history? | No version history in v1; Store snapshot for each edit; Store lightweight audit metadata only | No version history in v1 |

**User's choice:** `1` for all four questions.
**Notes:** Custom templates are mutable for future project creation only; historical project contents are not synchronized.

---

## Built-in Templates

| Question | Options Considered | Selected |
|----------|--------------------|----------|
| Where should built-in templates be stored? | Seed in database; Hard-code in service; Hybrid code source plus DB sync | Seed in database |
| Should built-in templates have `workspace_id`? | Global built-ins without `workspace_id`; Seed one built-in copy per workspace; Global built-ins with visibility table | Global built-ins without `workspace_id` |
| Can built-ins be edited through custom template APIs? | Never edit built-ins directly; Only instance admin can edit; Workspace admin can override | Never edit built-ins directly |
| How should DB seed handle payload changes in future releases? | Idempotent seed/migration updates built-ins; Seed only once; Create new built-in version | Idempotent seed/migration updates built-ins |

**User's choice:** `1` for all four questions.
**Notes:** Built-ins are global, read-only system records synced by stable key.

---

## Template List/Write Permissions

| Question | Options Considered | Selected |
|----------|--------------------|----------|
| Who can list templates in Phase 1 API? | Workspace admins and members; Workspace admins only; Admins, members, and guests | Workspace admins and members |
| Who can create, edit, or deactivate custom templates? | Workspace admins only; Admin plus project admin; Admin plus members with project-create permission | Workspace admins only |
| Who can duplicate/copy a built-in template into custom? | Workspace admins only; Any member who can create projects; Instance admin only | Workspace admins only |
| What should unauthorized write APIs return? | Standard DRF permission denied; 404 to hide the template; Custom error code | Standard DRF permission denied |

**User's choice:** `1` for all four questions.
**Notes:** Listing is available to admins and members; all write-like catalog mutation stays admin-only.

## the agent's Discretion

- Exact backend names and schema helper structure can follow existing Plane conventions.
- Exact JSON schema implementation is left to planning and implementation, provided the locked validation behavior is covered.

## Deferred Ideas

None.
