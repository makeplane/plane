# Fork Translation Key Migration Design

## Context

The upstream preview branch replaces the legacy TypeScript locale dictionaries with react-i18next JSON namespaces. The fork-only duration, Gantt dependency, and timeline propagation strings must be preserved during that merge.

The original merge plan assumed duration strings lived at `legacy.work_item.*`. Inspection of all 19 conflicted dictionaries and the merged Web call sites shows that assumption is incorrect:

- Legacy duration strings live at `legacy.common.duration_placeholder` and `legacy.common.working_days`.
- Web consumers request `common.duration_placeholder` and `common.working_days`.
- Dependency consumers request `gantt_dependency.*`.
- Propagation consumers request `timeline.propagation.*`.

## Selected Mapping

Migrate values to the JSON paths used by the merged application:

| Legacy source | JSON destination |
| --- | --- |
| `legacy.common.duration_placeholder` | `common.duration_placeholder` |
| `legacy.common.working_days` | `common.working_days` |
| `legacy.gantt_dependency` | `gantt_dependency` |
| `legacy.timeline.propagation` | `timeline.propagation` |

The migration must not create a root `work_item` object because no merged consumer requests those paths.

## Locale and Fallback Policy

For each destination value or object, preserve the locale-specific legacy value when it exists. Otherwise, copy the English legacy value so all 19 locales have identical key coverage.

- English retains `Enter days` and `working days`.
- Japanese retains `日数を入力` and `営業日`.
- Japanese retains its existing dependency and propagation translations.
- Existing locale-specific dependency objects are retained. Where their text is already English, it remains unchanged.
- Locales without duration or propagation translations receive the English text.

Creating new translations for languages that lack fork-authored text is out of scope. This avoids introducing unreviewed machine translations during an upstream merge.

## Migration Procedure

Use a temporary migration helper that loads each conflicted legacy dictionary, reads duration values from `legacy.common`, and writes the selected destinations into each upstream `common.json`. The helper must validate that the English fallback objects and strings exist before writing.

Remove the temporary helper after migration. Resolve upstream's deletion of all 19 legacy `translations.ts` files and stage the resulting JSON files.

## Validation

The completed migration must satisfy all of the following:

- No root `work_item` bootstrap remains in any affected `common.json`.
- `@plane/i18n check:sync` reports every locale synchronized with English.
- Generated translation types contain `common.duration_placeholder`, `common.working_days`, `gantt_dependency.*`, and `timeline.propagation.*`.
- All 19 legacy `translations.ts` conflicts are resolved by deletion.
- The temporary migration helper no longer exists.

## Commit Handling

This design was produced while Git was in an intentionally open merge. A standalone design commit would prematurely create the merge commit, contradicting the integration plan. The document is therefore staged with the resolved merge and committed only in Task 5's planned two-parent merge commit.
