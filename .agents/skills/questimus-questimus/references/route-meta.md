# Route: meta — states, labels, types (Questimus)

Hardcoded UUIDs (stable per project; re-resolve via the endpoints below if a call 404s).

## States (6)

| Name | UUID |
|---|---|
| Backlog | `887cb4c0-fa30-480c-b599-3cd6f8e5d626` |
| In Progress | `8e9860fd-7c0e-41b4-8c0e-69d449098819` |
| Done | `a1040f4a-6f41-41f5-87c4-a11deafcc606` |
| Cancelled | `7be7002b-18f8-496f-a21c-7478a48ce0db` |
| Blocked | `8a4f3a34-14cb-4a7e-9312-5020e5add52c` |
| ToDo | `063a3357-a439-4c6c-9082-918d4b65c97d` |

## Types (3, workspace-level)

| Name | UUID | Use |
|---|---|---|
| Plan | `c163bb6f-cdcf-4ec9-b04e-5cbbfbea86b1` | hierarchy items (plan roots, SPs, Ts) |
| Ticket | `27259b7c-9dc4-4788-9aea-80232d81e0df` | default; app reports, backlog, ideas |
| Design | `1e3bef1b-854e-4964-ad03-1741f776472e` | design/UI-UX work items (e.g. mockup work) |

## Labels

| Name | UUID |
|---|---|
| todo | `6d04000c-013d-4d97-a7e4-30adecae7259` |
| idea | `6d35da07-fbb0-470b-b108-9f7075e170e7` |
| user-report | `8722eb79-abe3-4258-b333-7575455db691` |
| verified | `248faccd-ec96-4c89-a324-639e1b569ea9` |

## Re-resolve (fallback)

```
node scripts/questimus.js states
node scripts/questimus.js labels
node scripts/questimus.js types
```

## People

| Name | UUID | Use |
|---|---|---|
| Karol | `a8f10b92-1ff5-4916-9ffa-6f96e40aeafb` | all imported work is assigned to Karol; `list --assignee karol` resolves it |
