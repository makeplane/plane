# ADR: i18n Package Selection for Plane

**Status:** Accepted
**Date:** 2026-03-25
**Decision:** Adopt react-i18next with custom type generation and CI sync tooling

---

## Context

Plane's i18n layer (`packages/i18n`) is a custom MobX-based solution using `intl-messageformat`. At current scale (~7,700 keys, 19 languages, ~132K lines of translation code), it has outgrown the approach:

- **No type safety** — `t(key: string)` accepts any string. Typos surface at runtime.
- **No sync between languages** — Keys added to English first; other languages fall behind silently.
- **Monolithic files** — `translations.ts` is 7,689 lines per language.
- **Not splittable** — All translations deep-merged into one object and loaded together (~280 KB for English alone).
- **No rich text** — Cannot embed bold/links in translations where position varies by language.
- **No RTL readiness** — No direction metadata for right-to-left languages.

### Codebase Characteristics

| Metric | Value |
|--------|-------|
| Translation keys | ~7,700 |
| Supported languages | 19 |
| Files importing `@plane/i18n` | ~1,215 |
| Dynamic key usage (`t(variable)`) | 308 keys across 259 files |
| English translations size | 306 KB (280 KB in `translations.ts` alone) |
| Keys on most complex page (Kanban + sidebar + detail) | ~260 (~3.4% of total) |
| Translation workflow | LLM-generated, developer-only |
| Apps using i18n | web (SPA), space (light SSR for metadata) |

### Dynamic Keys — A Critical Constraint

A pervasive pattern stores translation keys as data:

```typescript
// Defined in 25 constant files (308 unique keys)
{ titleTranslationKey: "common.states" }
{ i18n_label: "workspace_settings.general.title" }

// Consumed in 109+ component files
t(option.titleTranslationKey)
t(settingsDetails.i18n_label)
```

Powers filters, navigation, settings headers, and dropdowns. Any solution must support dynamic key lookup natively.

---

## Options Evaluated

### 1. Paraglide.js by Inlang

Compiler-based. Compiles messages into tree-shakable functions (`m.greeting({ name })`).

| Strength | Detail |
|----------|--------|
| Tree-shaking | Per-message elimination. Only used messages bundled. |
| Type safety | Generated function signatures with full autocomplete. |
| Runtime size | ~2 KB. |

| Risk | Severity | Detail |
|------|----------|--------|
| Dynamic keys unsupported | **Critical** | `m[variable]()` defeats tree-shaking by design. [Issue #440](https://github.com/opral/paraglide-js/issues/440) open. 308 dynamic keys in our codebase. |
| Bus factor of 1 | **High** | Single active developer (Samuel Stroschein). #2 contributor left Aug 2024. |
| No funding | **High** | No venture funding, no revenue model found. |
| Adoption | **High** | ~39,500 npm/week (0.6% of react-i18next). |
| Vite perf at scale | **Medium-High** | [Issue #306](https://github.com/opral/paraglide-js/issues/306): slowdowns at 1,200+ keys. We have 7,700. |
| No React Router adapter | **Medium** | Generic Vite plugin only. |

**Verdict:** Dynamic key limitation is a dealbreaker given our codebase patterns. Company viability risk too high for long-term infrastructure.

### 2. Lingui.js

Compile-time extraction + minimal runtime. Macros (`` t`message` ``, `<Trans>`) transformed at build.

| Strength | Detail |
|----------|--------|
| Runtime | ~3.3 KB core + ~2.5 KB React. |
| Extraction | `lingui extract` catches issues at build. |
| CI gate | `lingui compile --strict` fails on missing translations. |

| Concern | Detail |
|---------|--------|
| No namespace lazy loading | **Dealbreaker.** One catalog per locale. Experimental route splitting not production-ready. 280 KB blob stays monolithic. |
| Weak key-based type safety | Designed for source-string-as-key. No TypeScript validation of explicit key IDs. |
| Migration effort | All `t()` calls → Lingui macros. Requires Babel/SWC plugin. |
| No RTL built-in | No direction utilities. |

**Verdict:** No namespace lazy loading is a dealbreaker. Our product is large and growing — we need per-feature splitting.

### 3. FormatJS / react-intl

Runtime-based on ICU MessageFormat and ECMA-402 standards.

| Strength | Detail |
|----------|--------|
| Standard | ICU MessageFormat, ECMA-402, CLDR alignment. |
| CLI | Fast Rust-based `formatjs extract/verify`. 15+ TMS integrations. |
| Formatting | Built-in date, number, list, relative time components. |

| Concern | Detail |
|---------|--------|
| No namespace support | All messages in one flat object per locale. No splitting. |
| Largest runtime | ~20 KB gzipped. |
| Verbose API | `intl.formatMessage({ id: "key" })` vs `t("key")`. |
| Migration | API style change across 1,215 files. |

**Verdict:** No namespace support + verbose API + largest runtime. Does not solve our core problems.

### 4. react-i18next — Selected

Runtime-based with the mature i18next core.

| Strength | Detail |
|----------|--------|
| Ecosystem | 6.9M npm/week. Largest React i18n community. |
| Namespace splitting | First-class. Per-namespace lazy loading via `i18next-resources-to-backend`. |
| RTL | Built-in `i18n.dir()` with comprehensive language list. |
| Rich text | `<Trans>` component for positioned bold/links across languages. |
| Dynamic keys | Native runtime lookup. `t(variable)` just works. |
| API compatibility | `t("key", params)` — nearly identical to our current API. |
| ICU support | `i18next-icu` plugin preserves existing ICU MessageFormat strings. |

| Known Concern | Mitigation |
|---------------|------------|
| TypeScript OOM at 5K+ keys | Custom type generation — flat union type. Bypasses i18next's recursive types entirely. |
| Non-standard format | `i18next-icu` plugin. Zero translation string changes. |
| Runtime size (~22 KB) | Negligible in SPA context. Namespace splitting saves ~230 KB — net reduction. |
| No built-in sync | Custom CI script (~100 lines). |

### 5. Enhanced Custom Solution

Keep MobX + `intl-messageformat`, add type gen and CI.

**Why not:** Already attempted and led to current problems. Rich text component non-trivial to build. No community support for edge cases. Every developer maintains custom infra.

---

## Comparison Matrix

| Criterion | Paraglide | Lingui | FormatJS | **react-i18next** |
|-----------|-----------|--------|----------|-------------------|
| Dynamic keys | Broken | Works | Works | **Works** |
| Namespace splitting | N/A | None (experimental) | None | **First-class** |
| Type safety | Excellent (generated) | Weak (key-based) | Moderate | **Custom gen (excellent)** |
| RTL | No adapter | No built-in | Manual | **Built-in `dir()`** |
| Rich text | Markup syntax | Macro `<Trans>` | ICU XML | **`<Trans>` component** |
| Runtime | 2 KB | 3.3 KB | 20 KB | **22 KB** |
| npm weekly | 39.5K | 218K | 50M (all pkgs) | **6.9M** |
| Migration effort | Hard | Hard | Hard | **Low (wrapper)** |
| ICU compat | Plugin | Native | Native | **Plugin** |

---

## Decision

Adopt **react-i18next** wrapped inside `packages/i18n` to preserve the existing public API. Complement with custom type generation and CI sync tooling.

### Rationale

1. Dynamic keys work natively — 308 keys, 259 files, zero workarounds.
2. Namespace lazy loading — 280 KB → ~30-50 KB initial load.
3. Zero-touch migration — wrapper preserves API. No changes to 1,215 consumer files.
4. ICU compatibility — existing translations work unmodified.
5. RTL and rich text infrastructure ready for future phases.
6. Largest, most stable ecosystem — not going anywhere.

---

## Consequences

**Positive:**
- Type safety for translation keys (phased rollout)
- Automated missing key + collision detection across 19 locales
- Eliminates background loading of 18 unused languages (~5 MB no longer fetched)
- Per-route namespace loading (Phase 2+) for further payload reduction
- RTL and rich text infrastructure ready
- Dependency reduction: remove MobX, mobx-react, lodash-es, intl-messageformat from i18n package

**Negative:**
- New dependencies: i18next, react-i18next, i18next-icu, i18next-resources-to-backend
- Translation files: TypeScript objects → JSON (one-time scripted conversion, 95 source files → 418 JSON files)
- Two custom scripts to maintain (~250 lines total)

**Neutral:**
- Library runtime roughly equivalent (~22 KB vs ~15-20 KB current)
- Build: type generation adds seconds, comparable to current tsdown build
- File count increases: 95 TS files → 418 JSON files (more files, but each smaller and focused)

---

## References

- [i18next TypeScript OOM — #1857](https://github.com/i18next/i18next/issues/1857)
- [i18next Selector API](https://www.locize.com/blog/i18next-typescript-selector-api/)
- [Paraglide dynamic keys — #440](https://github.com/opral/paraglide-js/issues/440)
- [Paraglide Vite perf — #306](https://github.com/opral/paraglide-js/issues/306)
- [Monite i18next→Lingui migration](https://medium.com/@radist2s/one-command-one-day-multiple-languages-our-migration-from-react-i18next-to-linguijs-4b07ac73a9bb)
- ["Don't use i18next" — dev.to](https://dev.to/nevodavid/dont-use-i18next-n1a)
