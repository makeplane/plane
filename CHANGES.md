# CHANGES.md — FA Customizations vs Upstream

## Last Upstream Sync
- Date: ---
- Upstream commit: ---

## Core Files Modified (⚠️ watch on sync)
| File | Change | Conflict Risk |
|------|--------|---------------|
| -    | -      | -             |

## New Files Added (low risk)
| File | Purpose |
|------|---------|
| lib/fa/date-utils.ts | Shamsi calendar utils |
| lib/fa/features.ts | Feature flags |
| locales/fa/fa.json | Persian translations |

## How To Sync Upstream
```bash
git fetch upstream
git log HEAD..upstream/main --oneline   # see what's new
git diff HEAD..upstream/main --name-only  # see changed files
git rebase upstream/main                # apply upstream changes
# resolve conflicts if any
```
