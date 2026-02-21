---
title: "Trim i18n to 3 Languages (EN/VI/KO)"
description: "Remove all locale files except English, Vietnamese, Korean for internal banking use"
status: complete
priority: P2
effort: 1h
branch: preview
tags: [i18n, cleanup, banking]
created: 2026-02-21
---

# Trim i18n to 3 Languages

## Goal

Reduce supported languages from 19 to 3: English (en, default), Vietnamese (vi), Korean (ko). Delete 16 unused locale dirs, rename vi → vi for consistency, update all config/types.

## Phases

| #   | Phase                                                | Status   | Effort | File                                                   |
| --- | ---------------------------------------------------- | -------- | ------ | ------------------------------------------------------ |
| 1   | Delete unused locales + rename vi→vi + update config | complete | 20m    | [phase-01](./phase-01-delete-locales-update-config.md) |
| 2   | Add core.ts to ko and vi                             | complete | 15m    | [phase-02](./phase-02-add-core-translations.md)        |
| 3   | Verify UI + compile check                            | complete | 10m    | [phase-03](./phase-03-verify-and-compile.md)           |
| 4   | Update docs/rules                                    | complete | 15m    | [phase-04](./phase-04-update-docs.md)                  |

## Key Dependencies

- ko and vi missing `core.ts` file (en has it) -- Phase 2 creates them
- UI components (`language-and-timezone-list.tsx`, `languages-menu.tsx`) read from `SUPPORTED_LANGUAGES` array -- no code changes needed, just trim the array in Phase 1
- `locales/index.ts` has both static exports (en only) and dynamic `locales` map (all langs) -- trim dynamic map

## Locales to Delete (16)

cs, de, es, fr, id, it, ja, pl, pt-BR, ro, ru, sk, tr-TR, ua, zh-CN, zh-TW

## Locales to Keep (3)

en (default), ko, vi
