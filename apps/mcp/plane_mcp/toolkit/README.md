# toolkit

Shared building blocks for the tool surface, split by *when* they act. All re-exported from `__init__.py`, so a resource module needs one import.

| Module | Acts at | Provides |
|---|---|---|
| `spec.py` | declaration | `Action`, `build_description`, `build_annotations` |
| `runtime.py` | call | `missing`, `needs`, `require`, `one_of`, `opt`, `coerce_list`, `page_params`, `as_params`, `ids_of` |
| `mentions.py` | call | `render_mentions`, `tokenize_mentions`, `mention_user_ids`, `project_mention_error` |
| `paging.py` | response | `envelope`, `dump_results`, `pql_failure`, `workitem_page` |
| `governance.py` | policy | `workspace_owns_resource`, `workspace_owns`, `scoped`, `plan_gated` |
| `transforms.py` | listing | `StripOutputSchemas` |

Nothing here knows which catalogue is calling it. Anything encoding this server's own history — the `RESOURCES` tuple, retired names — lives under `tools/`.

## Workspace governance

Plane can move a resource's catalogue from the project to the workspace. Which scope owns it decides where writes go, and the wrong scope is refused in **both** directions:

| Write | Refused with | Means |
|---|---|---|
| project-scoped, workspace owns it | `workspace_managed` | omit `project_id` |
| catalogue, project still owns it | `workspace_not_managed` | pass `project_id` |

**There is no single flag.** `GOVERNED_BY` maps each resource to the one that governs it:

| Resource | Flag |
|---|---|
| work item types, epics, properties | `work_item_types` |
| states, labels, workflows, templates, automations | `states_owned_by_workspace` |

A workspace can own one and not the other, so never read one flag for the other resource.

**Two ways to ask, both needed:**

| Call | Reads | Use |
|---|---|---|
| `workspace_owns_resource(client, slug, resource)` | the flag | pick a scope *before* writing |
| `workspace_owns(exc, *fields)` | the refusal | after — the flag is cached and the lockout outlives it being toggled off |

### Adding a newly governed resource

1. **Add a row to `GOVERNED_BY`** naming its flag.
2. **Decorate the tool with `@scoped("<noun>")`**, below `@mcp.tool`. Either refusal becomes a message naming the scope that owns it. Where the API refuses by field rather than code — work item types do — pass the field: `@scoped("work item types", "work_item_types")`.
3. **Resolve the scope once** at the top of the dispatch, not per call site. Shape is yours: `workitem_type` returns a tuple, `state` and `workitem_property` a small local `_Scope`.
4. **Refuse fields the other scope lacks.** A catalogue state has no ordering, triage flag or default; sent anyway they are dropped in silence, which reads as success.

`workitem_type resolve` is the worked ask-first example: reads the flag, adopts the type from the catalogue, imports it into the project — and still handles the refusal in case the flag is stale.

`test_a_wrong_scope_refusal_is_answered_not_raised` drives a real refusal through every scoped resource, so step 2 cannot be forgotten.

## Plan gates

`@plan_gated("<feature>")` turns a 402 — or a 400 whose prose says "upgrade your plan" — into a message naming the feature, rather than an error a caller will retry. The argument is the fallback label: where the refusal names the feature itself, that wins, since one resource can trip several gates (`project` trips five).
