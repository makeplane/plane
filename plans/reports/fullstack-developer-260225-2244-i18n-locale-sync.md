# Phase Implementation Report

### Executed Phase

- Phase: i18n locale sync (translations.ts only)
- Plan: none (direct task)
- Status: completed

### Files Modified

| File                                                                        | Change                                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/en/translations.ts` | +157 lines: added `auth` section (67 keys), `appearance` root key, `profile.actions.appearance`, 4 `workspace_analytics` keys                           |
| `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/ko/translations.ts` | +27 lines: added 18 missing EN keys across `project_settings`, `workspace_settings`, `profile.actions`                                                  |
| `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/vi/translations.ts` | +34 lines: added 21 missing EN keys (18 same as KO + `common.actions.restore`, `estimates.validation.remove_empty`, `workspace_projects.network.label`) |

### Tasks Completed

- [x] Added 18 missing keys to KO translations.ts (all from EN)
- [x] Added 21 missing keys to VI translations.ts (18 + 3 extra)
- [x] Added `auth` section (67 keys) to EN translations.ts (English values derived from key semantics)
- [x] Added `workspace_analytics.total_projects/total_users/total_work_items/total_intake` to EN
- [x] Added `appearance` root key to EN
- [x] Added `profile.actions.appearance` to EN
- [x] Resolved `profile.actions` conflict — all 3 langs now have `preferences`, `api-tokens`, `appearance`
- [x] Verified all files parse correctly
- [x] Verified comparator shows 0 missing / 0 extra for all 5 locale files

### Tests Status

- Type check: pass (npx tsx eval — no errors)
- Comparator: `en→ko missing: 0, extra in ko: 0` | `en→vi missing: 0, extra in vi: 0`
- All 5 locale files: translations.ts, core.ts, editor.ts, empty-state.ts, accessibility.ts — fully synced

### Final Key Counts (translations.ts)

| Locale | Keys |
| ------ | ---- |
| en     | 1990 |
| ko     | 1990 |
| vi     | 1990 |

### Issues Encountered

None. All edits applied cleanly without syntax errors.

### Next Steps

- Add CI check for key count parity between locales (prevent future drift)
- Translate placeholder English values in KO/VI for the newly added keys (done by native translators)
- Consider removing duplicate auth keys from `core.ts` now that `translations.ts` has them in all 3 locales

### Unresolved Questions

1. `core.ts` has overlapping auth keys (sign_in, password, unique_code) — are those now redundant given `auth.*` in `translations.ts`? Safe to remove from `core.ts`?
2. EN `workspace_analytics` has both `total_users_count` (old) and `total_users` (new) — intentional or legacy duplication?
