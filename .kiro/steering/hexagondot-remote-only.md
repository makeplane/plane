---
inclusion: always
---

# Remote repository policy

This working copy is a **HexagonDot** fork. Never treat upstream Makeplane as a write target.

## Allowed

- Remote: `origin` → `https://github.com/HexagonDot/plane`
- Push branches to `origin` only
- Create/update/close PRs with `--repo HexagonDot/plane`
- Default PR base: `main` on `HexagonDot/plane` (unless the user specifies another HexagonDot branch)

## Forbidden

- Push to `upstream` / `https://github.com/makeplane/plane`
- Open, update, or merge PRs against `makeplane/plane`
- Use `gh` without `--repo HexagonDot/plane` when the default would resolve to Makeplane

## When creating a PR

```bash
gh pr create --repo HexagonDot/plane --base main --head <branch> ...
```

## Fetch-only upstream

`upstream` (`makeplane/plane`) may be used for **read-only** fetch/compare if needed. Never push or open write operations against it.
