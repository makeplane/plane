# Change Request

## Intent

Describe the user-visible behavior to add or change.

## Affected Domains

- `work_items`

## Contract Changes

- API:
- Database:
- Frontend state:
- i18n:

## Required Evidence

- Source paths:
- Tests:
- Documentation:

## Acceptance Checks

- `pnpm check`
- `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`
- `python .plane-ai-doc-loop/runtime/validate_semantic.py`

## Machine Declaration

Update `docs/semantic/change_declaration.json` with the active domains, mapping IDs, source evidence, and tests for this change.
