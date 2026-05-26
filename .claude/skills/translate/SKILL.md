---
name: translate
description: Translate or update keys in packages/i18n/src/locales. Use whenever adding, changing, or reviewing strings across any target locale — enforces do-not-translate terminology, CLDR plural forms, placeholder/tag preservation, per-locale punctuation/register, and the AI-translation review workflow. Required reading before touching any *.json under src/locales.
user_invocable: true
---

<!--
  `user_invocable: true` is advisory and follows the same convention as the existing
  `pr-description.md` and `release-notes.md` skills in this repo. No harness behavior
  in this codebase keys off the field today; it documents intent for the Claude Code
  skill registry. The skill is invoked via the slash command (`/translate`) registered
  in `.claude/commands/translate.md`, or by name when an agent infers relevance.
-->

# Translate (Plane i18n)

Single source of truth for turning English UI strings into every target locale under `packages/i18n/src/locales/`. Follow this skill exactly — every mistake here ships to every user in that language.

The locale list grows over time. This skill is intentionally generic: rules apply to any locale present now or added later. When you add a locale not explicitly named below, see **Adding a locale not documented here** at the bottom.

Sources distilled from: Microsoft Localization Style Guides, Mozilla L10n, Unicode CLDR plural rules, W3C i18n, Google developer style guide, Apple HIG, GitHub Primer, MQM error typology, Lokalise/Crowdin/Phrase best-practice docs, and Microsoft's AI/LLM-for-translation guidance.

**Source of truth**: `packages/i18n/src/locales/en/<namespace>.json`. Every other locale mirrors English key-for-key. The `sync-check.ts` script catches missing / stale / collision keys; it does **not** catch value-quality mistakes. That is what this skill is for.

## When to Use

- Adding a new key to any `packages/i18n/src/locales/en/*.json`
- Renaming or rewording an English value (every target is now stale)
- Adding a new language (copy from `en/`, then translate each file)
- Syncing after `pnpm --filter @plane/i18n run sync:check` reports drift
- Reviewing any PR that touches `packages/i18n/src/locales/`

Skip only for trivial English-only typo fixes that don't change meaning or length meaningfully.

## The Two Iron Rules

1. **Trademarks, brand marks, plan tier names, third-party product names, acronyms, and code tokens are never translated.** Plane's brand marks (Plane, Plane AI, Power K, PQL, Active Cycles, Sticky/Stickies, Intake), plan tiers (Pro, Business, Enterprise), third-party products (GitHub, Slack, Notion, etc.), and acronyms (API, OAuth, etc.) stay Latin in every locale.
2. **CLDR plural categories are mandatory.** Every target locale must include **every** plural keyword the language requires. Missing a form renders the wrong word at runtime and passes `sync-check` silently.

Common feature nouns — Cycle, Module, Epic, Page — **are translated** into the target language using the canonical glossary further down. They are not brand marks; they are everyday words that belong in the user's language.

The rest of this skill explains how to execute on those rules.

## Do-Not-Translate (DNT) Glossary

For each term: the source, the required rendering per script group, and **forbidden renderings** that have appeared historically and must be reverted when seen.

### Plane brand & features

| Source term                        | Latin locales (fr, es, it, de, pt-BR, pl, cs, sk, ro, tr-TR, vi-VN, id) | ja (katakana-default) | ko (Hangul-default) | zh-CN / zh-TW                                 | ru                | ua                | **Forbidden** (never produce)                                                     |
| ---------------------------------- | ----------------------------------------------------------------------- | --------------------- | ------------------- | --------------------------------------------- | ----------------- | ----------------- | --------------------------------------------------------------------------------- |
| **Plane**                          | Plane                                                                   | Plane                 | Plane               | Plane                                         | Plane             | Plane             | 飛行機, 飞机, 비행기, Самолёт, Літак, Avion, Avião, Aereo, Flugzeug               |
| **Plane AI** (formerly PI Chat)    | Plane AI                                                                | Plane AI              | Plane AI            | Plane AI                                      | Plane AI          | Plane AI          | Чат ИИ, AI 聊天, AIチャット, AI 채팅, Chat IA, AI Çet, PI Chat (legacy)           |
| **Power K**                        | Power K                                                                 | Power K               | Power K             | Power K                                       | Power K           | Power K           | Command K, Command Palette, コマンドパレット, 命令面板, Палитра команд            |
| **PQL**                            | PQL                                                                     | PQL                   | PQL                 | PQL                                           | PQL               | PQL               | any expansion of the acronym into the target language                             |
| **Intake** (feature name)          | Intake                                                                  | Intake                | Intake              | Intake                                        | Intake            | Intake            | Inbox, 受信箱, 收件箱, Входящие, Triage, Boîte de réception                       |
| **Active Cycles** (workspace view) | Active Cycles                                                           | Active Cycles         | Active Cycles       | Active Cycles                                 | Active Cycles     | Active Cycles     | Translate as a unit; never split into generic "active" + localized "cycles"       |
| **Sticky** / **Stickies**          | Sticky / Stickies                                                       | Sticky / Stickies     | Sticky / Stickies   | Sticky / Stickies (Latin inside Chinese text) | Sticky / Stickies | Sticky / Stickies | 便签, 便利貼, メモ, 付箋, スティッキー, 메모, 스티키, заметка, Стикер, Note, Nota |
| **Pro** (plan tier)                | Pro                                                                     | Pro                   | Pro                 | Pro                                           | Pro               | Pro               | Профессиональный, プロフェッショナル, 专业版, 專業版, Profesional                 |
| **Business** (plan tier)           | Business                                                                | Business              | Business            | Business                                      | Business          | Business          | Бизнес, ビジネス, 商业版, 商務版, Negocios, Negócios                              |
| **Enterprise** (plan tier)         | Enterprise                                                              | Enterprise            | Enterprise          | Enterprise                                    | Enterprise        | Enterprise        | Корпоративный, エンタープライズ, 企业版, 企業版, Empresarial                      |

### Plane feature noun translation glossary (translate, do not preserve)

These are common nouns. **Translate them into the target language** using the canonical form below. This follows Microsoft, Apple, and Mozilla style guides for product-UI translation: feature common nouns belong in the user's language; only trademarks, brand marks, and acronyms stay Latin. Leaving these in Latin in non-Latin locales reads as half-translated and is a measurable quality defect.

Use the table verbatim — never coin new variants; never leave the Latin form in the locale value.

| Source      | zh-CN | zh-TW | ja         | ko     | ru       | ua       | de     | fr      | es      | it     | pt-BR   | pl     | cs      | sk      | ro      | tr-TR    | vi-VN  | id      |
| ----------- | ----- | ----- | ---------- | ------ | -------- | -------- | ------ | ------- | ------- | ------ | ------- | ------ | ------- | ------- | ------- | -------- | ------ | ------- |
| **Cycle**   | 周期  | 週期  | サイクル   | 사이클 | Цикл     | Цикл     | Zyklus | Cycle   | Ciclo   | Ciclo  | Ciclo   | Cykl   | Cyklus  | Cyklus  | Ciclu   | Döngü    | Chu kỳ | Siklus  |
| **Cycles**  | 周期  | 週期  | サイクル   | 사이클 | Циклы    | Цикли    | Zyklen | Cycles  | Ciclos  | Cicli  | Ciclos  | Cykle  | Cykly   | Cykly   | Cicluri | Döngüler | Chu kỳ | Siklus  |
| **Module**  | 模块  | 模組  | モジュール | 모듈   | Модуль   | Модуль   | Modul  | Module  | Módulo  | Modulo | Módulo  | Moduł  | Modul   | Modul   | Modul   | Modül    | Mô-đun | Modul   |
| **Modules** | 模块  | 模組  | モジュール | 모듈   | Модули   | Модулі   | Module | Modules | Módulos | Moduli | Módulos | Moduły | Moduly  | Moduly  | Module  | Modüller | Mô-đun | Modul   |
| **Epic**    | 史诗  | 史詩  | エピック   | 에픽   | Эпик     | Епік     | Epic   | Epic    | Epic    | Epic   | Epic    | Epik   | Epik    | Epik    | Epic    | Epik     | Epic   | Epik    |
| **Epics**   | 史诗  | 史詩  | エピック   | 에픽   | Эпики    | Епіки    | Epics  | Epics   | Epics   | Epics  | Epics   | Epiki  | Epiky   | Epiky   | Epice   | Epikler  | Epic   | Epik    |
| **Page**    | 页面  | 頁面  | ページ     | 페이지 | Страница | Сторінка | Seite  | Page    | Página  | Pagina | Página  | Strona | Stránka | Stránka | Pagină  | Sayfa    | Trang  | Halaman |
| **Pages**   | 页面  | 頁面  | ページ     | 페이지 | Страницы | Сторінки | Seiten | Pages   | Páginas | Pagine | Páginas | Strony | Stránky | Stránky | Pagini  | Sayfalar | Trang  | Halaman |

Notes:

- Single-form locales (zh-CN, zh-TW, ja, ko, vi-VN, id) use the same form for singular and plural — the column repeats by design.
- Slavic locales (ru, ua, pl, cs, sk) show **nominative singular** and **nominative plural**. Inside ICU `{count, plural, ...}` blocks, use the case-correct form per CLDR keyword (see the Slavic case-form table further down).
- Some Latin locales (fr, vi-VN, id) have forms identical to English (`Cycle`, `Module`, `Page`) — that's the natural cognate, not a Latin-preservation rule.
- **Epic / Epics**: stays Latin in most Latin locales because there's no clean cognate (Spanish `épico` is for poetry/film; same for it/pt-BR/de/fr). Slavic locales use phonetic transliteration that's standard in their software industry (Эпик, Епік, Epik). CJK locales use the literal/transliterated form (史诗, エピック, 에픽).
- **Generic uses translate normally and don't follow this glossary:** `next page` (paginator), `the page` (browser refresh), `status page`, `web page`, `life cycle`, `release cycle`, `rate-limit cycle`, `cycle of releases` — these are not the Plane Cycle/Page feature; translate them as ordinary words in the surrounding prose.
- When editing an existing file, migrate occurrences you are already touching. Do not bulk-rewrite unrelated strings in the same PR — land a separate sweep PR with the `chore(i18n):` prefix.

#### Slavic case forms inside ICU plural blocks

When a Slavic plural block counts a Plane feature noun, use these forms:

| Locale | Term     | one (nom.sg.) | few      | many     | other    |
| ------ | -------- | ------------- | -------- | -------- | -------- |
| **ru** | Цикл     | Цикл          | Цикла    | Циклов   | Цикла    |
| **ru** | Модуль   | Модуль        | Модуля   | Модулей  | Модуля   |
| **ru** | Эпик     | Эпик          | Эпика    | Эпиков   | Эпика    |
| **ru** | Страница | Страница      | Страницы | Страниц  | Страницы |
| **ua** | Цикл     | Цикл          | Цикла    | Циклів   | Цикла    |
| **ua** | Модуль   | Модуль        | Модуля   | Модулів  | Модуля   |
| **ua** | Епік     | Епік          | Епіка    | Епіків   | Епіка    |
| **ua** | Сторінка | Сторінка      | Сторінки | Сторінок | Сторінки |
| **pl** | Cykl     | Cykl          | Cykle    | Cykli    | Cyklu    |
| **pl** | Moduł    | Moduł         | Moduły   | Modułów  | Modułu   |
| **pl** | Epik     | Epik          | Epiki    | Epików   | Epika    |
| **pl** | Strona   | Strona        | Strony   | Stron    | Strony   |
| **cs** | Cyklus   | Cyklus        | Cykly    | Cyklu    | Cyklů    |
| **cs** | Modul    | Modul         | Moduly   | Modulu   | Modulů   |
| **cs** | Epik     | Epik          | Epiky    | Epiku    | Epiků    |
| **cs** | Stránka  | Stránka       | Stránky  | Stránky  | Stránek  |
| **sk** | Cyklus   | Cyklus        | Cykly    | Cyklu    | Cyklov   |
| **sk** | Modul    | Modul         | Moduly   | Modulu   | Modulov  |
| **sk** | Epik     | Epik          | Epiky    | Epiku    | Epikov   |
| **sk** | Stránka  | Stránka       | Stránky  | Stránky  | Stránok  |

Per CLDR for ru/ua: `one` fires for 1, 21, 31… (nom.sg.); `few` for 2–4, 22–24… (gen.sg.); `many` for 0, 5–20, 25–30… (gen.pl.); `other` for non-integer counts (gen.sg.). For pl: `one` (1), `few` (2–4 not 12–14, nom.pl.), `many` (0, 5–20, gen.pl.), `other` (decimals, gen.sg.). cs/sk: `one` (1), `few` (2–4, nom.pl.), `many` (decimals, gen.sg.), `other` (0, 5+, gen.pl.).

### Third-party products & standards (always Latin, every locale)

GitHub, GitLab, Bitbucket, Slack, Discord, Zoom, Microsoft Teams, Jira, Linear, Asana, Notion, Confluence, Trello, Figma, Google, Google Drive, Google Calendar, Google Docs, Google Sheets, Gmail, YouTube, Dropbox, Zapier, Tiptap, ProseMirror, Yjs, Hocuspocus, Socket.IO, React, TypeScript, JavaScript, Python, Django, PostgreSQL, Redis, RabbitMQ.

Also preserve: OAuth, OIDC, SAML, SSO, LDAP, API, REST, GraphQL, URL, URI, ID, UUID, JSON, YAML, CSV, TSV, XML, HTML, PDF, PNG, JPG, SVG, CSS, HTTP, HTTPS, TLS, SSL, IP, CIDR, DNS, ARIA, WCAG.

### Inside-string tokens (mechanical — preserve exactly)

- **ICU variables**: `{count}`, `{name}`, `{workspace}`, `{userName}` — never translate, never rename, never move inside `{}`.
- **ICU pluralization / select keywords**: `plural`, `select`, `one`, `few`, `many`, `other`, `zero`, `two`, `=0`, `=1`, `#` — never translate.
- **HTML & JSX tags**: `<b>…</b>`, `<a href="…">…</a>`, `<br/>`, `<code>…</code>` — preserve attributes and nesting; translate only the visible text between tags.
- **i18next `Trans` numbered fragments**: `<0>…</0>`, `<1>…</1>` — preserve the numbers exactly; only translate the wrapped text. Never renumber.
- **Markdown**: `**bold**`, `*italic*`, `` `code` ``, `[text](url)` — keep the syntax; translate only human-readable prose.
- **Escape sequences**: `\n` (newline), `\t`, `\"`, `\\` — preserve at the same positions.
- **Keyboard keys & modifiers**: `Ctrl`, `Cmd`, `Shift`, `Alt`, `Option`, `Enter`, `Return`, `Esc`, `Tab`, `Space`, `Backspace`, arrow glyphs (`↑↓←→`), and OS glyphs (`⌘⌥⌃⇧`) — preserve exactly as shown on the physical key.
- **File extensions & formats**: `.json`, `.csv`, `MM/DD/YYYY` format strings — preserve.

## Per-Script Rules

Apply by target-language script, not by locale list. Adding a new Latin-script locale? It follows the Latin-script rules below. Adding a new Cyrillic locale? It follows the Cyrillic section. Scripts not yet shown here (Arabic, Hebrew, Thai, Greek, Hindi/Devanagari, etc.) — see **Adding a locale not documented here**.

### Latin-script locales

Currently includes fr, es, it, de, pt-BR, pl, cs, sk, ro, tr-TR, vi-VN, id — and any future locale that uses the Latin alphabet (hu, nl, sv, da, nb, fi, hr, bg-using-Latin variants, etc.).

**Translate Plane feature nouns** (Cycle, Cycles, Module, Modules, Epic, Epics, Page, Pages) using the per-locale form from the glossary above. **Keep Latin** for Plane brand marks (Plane, Plane AI, Power K, PQL, Active Cycles, Sticky, Stickies, Intake), plan tier names (Pro, Business, Enterprise), and third-party brands (GitHub, Slack, etc.).

```
✅ "Créer un Cycle"                         (fr — natural cognate from glossary, identical to English)
✅ "Crear un nuevo Ciclo"                   (es — natural Spanish cognate from glossary)
✅ "Archiviare questo Modulo"               (it — natural Italian cognate from glossary)
✅ "Nueva Epic"                             (es — Epic has no clean cognate; stays Latin per glossary)
✅ "Archivieren Sie diesen Zyklus"          (de — natural German form from glossary)
✅ "Buat Siklus baru"                       (id — natural Indonesian form from glossary)
✅ "Buat Sticky baru"                       (id — Sticky is a Plane brand mark, stays Latin)
✅ "Wechseln Sie zum Pro-Plan"              (de — Pro is a plan tier name, stays Latin)
❌ "Créer un Cycle"                         WRONG when the locale should be `Zyklus` (de). Always use the glossary form.
❌ "Archivieren Sie diesen Cycle"           (de — feature noun was left in Latin; use Zyklus per glossary)
❌ "Créer un Cercle"                        (fr — invented translation; use the glossary form)
❌ "Nueva Saga"                             (es — translated "Epic" with the wrong cognate)
❌ "Buat Catatan Tempel"                    (id — translated "Sticky" which is a brand mark; keep Latin)
```

Generic uses translate normally and do not follow the glossary: a paginator's `next page` is `nächste Seite` / `página siguiente` (generic noun, not the Plane Pages feature). The glossary applies only when EN refers to the Plane product feature.

### Japanese (ja) — natural Japanese rendering

**Plane feature nouns** (Cycle, Module, Epic, Page) use the natural Japanese form per the glossary above (サイクル, モジュール, エピック, ページ — katakana for foreign-origin nouns; native Japanese where one applies, like 付箋 for an Apple/Microsoft-style "sticky note"). **Brand marks** stay in Latin: Plane, Plane AI, Power K, PQL, Active Cycles, Sticky, Stickies, Intake, GitHub, Slack, Pro/Business/Enterprise.

For new katakana coinages and existing translations, the long-vowel mark `ー` is added for words ending in `-er`, `-or`, `-ar`, `-y` in English. This is the Microsoft Japanese style-guide convention and the current industry default:

- user → **ユーザー** (not ユーザ)
- server → **サーバー** (not サーバ)
- editor → **エディター** (not エディタ)
- property → **プロパティー** (_kept as_ プロパティ where the existing codebase already does — match the surrounding file's convention)

Tone: polite form です・ます. Never plain form だ・である. Avoid over-formal 尊敬語・謙譲語 for SaaS product copy — it reads stilted.

Quotation marks: 「」 for primary quotes, 『』 for nested or for titles of works. Full-width punctuation: 。、（）・！？.

### Korean (ko) — Hangul rendering

**Plane feature nouns** (Cycle, Module, Epic, Page) use the natural Korean form per the glossary above (사이클, 모듈, 에픽, 페이지 — Hangul transliteration where the term is product-coined; native Korean word where one applies). **Brand marks** stay in Latin: Plane, Plane AI, Power K, PQL, Active Cycles, Sticky, Stickies, Intake, GitHub, Slack, Pro/Business/Enterprise.

For new terms not on the glossary: prefer the native Korean word where one exists (`설정` for Settings); use Hangul phonetic transliteration for product-coined nouns with no native equivalent. Do not coerce a phonetic loanword when a natural Korean word exists — `버킷` for "Bucket" reads as a foreign trademark, `장바구니` reads as a Korean noun.

**Korean particle agreement**: when introducing a consonant-ending noun (사이클, 에픽, 모듈), follow with the consonant-form particle (을/은/이/과), not the vowel-form (를/는/가/와). `사이클을 추가` not `사이클를 추가`.

Register:

- **System and error messages** → 합니다체 (high-formal: 합니다, 됩니다, 입니다). Existing files in this register today: `ko/auth.json`, `ko/error/*.json`.
- **Empty states, onboarding microcopy, tooltips** → 해요체 acceptable (softer: 해요, 돼요, 이에요) if the existing file uses it. Existing files in this register today: `ko/empty-state.json`, `ko/tour.json`. Always match the surrounding file rather than introducing a new register mid-namespace.
- Never casual 반말.

Punctuation: Western punctuation (`. , ? !`); straight quotes `"…"` and `'…'`.

### Simplified Chinese (zh-CN) and Traditional Chinese (zh-TW) — translate feature nouns

**Plane feature nouns** (Cycle, Module, Epic, Page) translate to natural Chinese per the glossary above (zh-CN: 周期, 模块, 史诗, 页面 — zh-TW: 週期, 模組, 史詩, 頁面). This is what Microsoft's zh-CN style guide and every mainstream zh-localized SaaS product (Notion, Slack, Atlassian) does for common feature nouns.

**Brand marks stay Latin**: Plane, Plane AI, Power K, PQL, Active Cycles, Sticky, Stickies, Intake, GitHub, Slack, Pro/Business/Enterprise — these are trademark-style terms.

**Insert a half-width space on each side of embedded Latin tokens** — this is Microsoft's zh-CN guideline and required for legibility. **Exception**: no space between a Latin token and adjacent full-width punctuation (`。，；：？！`); the punctuation already supplies visual breathing room.

```
✅ "使用 GitHub 登录"           (Latin brand → half-width spaces around)
✅ "创建周期"                    (zh-CN feature noun translated; no Latin = no spaces)
✅ "归档此史诗"                  (Plane Epic → 史诗 per glossary)
✅ "添加 Sticky"                (Sticky is a brand mark → Latin + half-width space)
✅ "升级到 Pro"                 (Pro is a plan tier → Latin)
✅ "登录 GitHub。"               (no space between Latin token and full-width period)
❌ "使用GitHub登录"               (Latin brand without surrounding half-width space)
❌ "创建 Cycle"                   (feature noun left in Latin — should be 周期)
❌ "创建Cycle"                    (feature noun in Latin AND missing space)
❌ "登录 GitHub 。"               (stray space before full-width period)
❌ "创建赛克"                     (invented transliteration of Cycle — use the glossary's 周期)
```

Punctuation is **full-width**: 。，？！；：. Quotes:

- zh-CN: `"…"` (primary) and `'…'` (nested)
- zh-TW: `「…」` (primary) and `『…』` (nested)
- Work titles (book/movie/app/article names): `《…》`

Variant discipline: zh-CN ≠ zh-TW. They differ in script (简体 vs 繁體) **and** vocabulary (视频 vs 影片; 软件 vs 軟體; 网络 vs 網路). Never mass-copy between the two directories.

Register: 您 (formal polite) in Plane UI — the product is B2B/SaaS. Reserve 你 for consumer/youth contexts (not applicable here).

### Cyrillic locales

Currently includes ru, ua — and any future Cyrillic locale (bg-BG, sr-Cyrl, mk, be, kk-Cyrl, etc.).

**Plane feature nouns** (Cycle, Module, Epic, Page) use the natural Cyrillic form per the glossary above (Цикл/Циклы, Модуль/Модули, Эпик/Эпики, Страница/Страницы in ru — Цикл/Цикли, Модуль/Модулі, Епік/Епіки, Сторінка/Сторінки in ua). **Brand marks** stay in Latin: Plane, Plane AI, Power K, PQL, Active Cycles, Sticky, Stickies, Intake, GitHub, Slack, Pro/Business/Enterprise.

For new terms not on the glossary: prefer the native Cyrillic word where one exists; use phonetic transliteration only when no native word applies (`Бакет` is wrong for "Bucket" — use `Корзина`/`Кошик`).

**Slavic case forms inside `{count, plural, ...}` blocks** are case-correct per CLDR keyword (one=nom.sg., few=gen.sg., many=gen.pl., other=gen.sg.). See the case-form table in the glossary section.

Register:

- **ru**: formal **Вы** (capitalized) when addressing a **single user directly** in respectful/formal contexts (onboarding, settings, confirmation dialogs); lowercase **вы** for plural/general references ("все вы"). Default to capitalized Вы in tooltips/dialogs and lowercase вы in descriptive copy.
- **ua**: modern Ukrainian software convention is lowercase **ви** by default; capitalized **Ви** is reserved for very formal direct address. This is the opposite convention from Russian — do not copy-paste Russian capitalization rules into Ukrainian files.

Punctuation: primary quotes `«…»`, nested `„…"`.

**Plural forms — critical**: both ru and ua require `one / few / many / other`. See CLDR section below.

## CLDR Plural Rules

Every `{count, plural, …}` string must contain **every** keyword the target language's CLDR rule requires. `other` is always required, even in single-form languages.

**Canonical source**: Unicode CLDR Language Plural Rules chart — the definitive, versioned list of required categories for every language. Always verify against the current CLDR chart when adding a locale, since rules occasionally shift across CLDR releases. Libraries like `Intl.PluralRules` can resolve the rule at runtime.

Below are the required keywords for locales currently in the repo. When adding a new locale, look up its categories in CLDR and add the row here.

| Locale                                             | Required keywords                                                                     | Example mapping                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| en, es, de, tr-TR, vi-VN, id, ja, ko, zh-CN, zh-TW | `one, other` (single-form locales may use `other` alone, but **always emit `other`**) | 1 → one; 2+ → other                                                           |
| fr                                                 | `one, many, other`                                                                    | 0, 1 → one; 1 000 000 → many; else other                                      |
| it                                                 | `one, many, other`                                                                    | 1 → one; 1 000 000 → many; else other                                         |
| pt-BR                                              | `one, many, other`                                                                    | 0, 1 → one; 1 000 000 → many; else other                                      |
| ro                                                 | `one, few, other`                                                                     | 1 → one; 0, 2–19 → few; 20+ → other                                           |
| pl                                                 | `one, few, many, other`                                                               | 1 → one; 2–4 (not 12–14) → few; 0, 5–20, many-digit → many; decimals → other  |
| cs                                                 | `one, few, many, other`                                                               | 1 → one; 2–4 → few; decimals → many; 0, 5+ → other                            |
| sk                                                 | `one, few, many, other`                                                               | same pattern as cs                                                            |
| ru                                                 | `one, few, many, other`                                                               | 1, 21, 31… → one; 2–4, 22–24… → few; 0, 5–20, 25–30… → many; decimals → other |
| ua                                                 | `one, few, many, other`                                                               | same pattern as ru                                                            |
| ar (when added)                                    | `zero, one, two, few, many, other`                                                    | Six categories — the maximum any language uses                                |

> **Note on the consolidated row.** CLDR itself only requires `other` for `tr-TR`, `vi-VN`, `id`, `ja`, `ko`, `zh-CN`, `zh-TW` (single-form locales). Emitting both `one` and `other` with identical content is a **project convention** — it keeps tooling and linters consistent across the codebase. It is not a CLDR requirement, and `Intl.PluralRules` will return only `"other"` for these locales at runtime.

For any locale not listed: look up the CLDR categories before writing a single plural string. Arabic has six; Welsh has six; most Slavic languages have four; most Romance languages have two or three; CJK / Turkic / Thai have one (still emit `other`).

Rules in practice:

1. **Never drop a required form**, even when the word is identical across forms — emit each one explicitly.
2. **Never add a form the target doesn't have.** German does **not** use `few`. Any `few` clause in `de/*.json` is a bug and must be removed.
3. In single-form locales (ja/ko/zh/tr/vi/id), emit `one` + `other` with identical content so tooling and linters stay consistent.
4. The `other` case is always the fallback — it must render a grammatically complete sentence on its own.

Examples:

```json
// ✅ Correct — Russian (four forms; `other` fires for non-integer counts and takes genitive singular)
"members": "{count, plural, one {# участник} few {# участника} many {# участников} other {# участника}}"

// ✅ Correct — Polish (four forms)
"items": "{count, plural, one {# element} few {# elementy} many {# elementów} other {# elementu}}"

// ✅ Correct — Romanian (three forms)
"days": "{count, plural, one {# zi} few {# zile} other {# de zile}}"

// ✅ Correct — French (three forms; `many` covers 1 000 000, 2 000 000, …)
"members": "{count, plural, one {# membre} many {# membres} other {# membres}}"

// ✅ Correct — Japanese (single form, both keywords emitted)
"label": "{count, plural, one {サイクル} other {サイクル}}"

// ❌ Wrong — German with spurious `few`
"label": "{count, plural, one {Zyklus} few {Zyklen} other {Zyklen}}"

// ❌ Wrong — Russian missing `few` and `many`
"label": "{count, plural, one {Цикл} other {Циклы}}"
```

## Placeholders, HTML, Markdown (preservation checklist)

For every translated string, verify before saving:

- [ ] Identical set of `{variables}` in source and target (character-for-character — `{userName}` is not `{username}`)
- [ ] Identical HTML/JSX tags with identical attributes and nesting
- [ ] Identical i18next `Trans` numbered tags (`<0>…</0>`, `<1>…</1>` — never renumber)
- [ ] Identical Markdown syntax (`**bold**`, `` `code` ``, `[link text](url)`)
- [ ] Identical `\n` positions (layout relies on these)
- [ ] No additions (no extra explanatory words), no omissions (no collapsed clauses)

Variables **may be repositioned** for grammatical fit:

```
en:  "Welcome, {name}! You have {count} new work items."
fr:  "Bienvenue, {name} ! Vous avez {count} nouveaux work items."
ja:  "{name}さん、ようこそ。{count}件の新しい作業項目があります。"
```

## Per-Locale Punctuation & Spacing

Apply in every translated string. These are MQM "Locale Conventions" violations when missed — a measurable quality defect.

Table below covers locales currently in the repo; add a row when you add a locale.

| Locale                 | Key rules                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **fr**                 | Narrow NBSP (U+202F, fallback U+00A0) **before** `:`, `;`, `?`, `!`, `%`, `»` and **after** `«`. Primary quotes `«  »` (with NBSPs), nested `"…"`.                                               |
| **de**                 | Primary quotes `„…"` (low-high); **no** NBSP before punctuation. Avoid imperatives in system strings; prefer infinitive constructions ("Werkelement erstellen", not "Erstelle ein Werkelement"). |
| **es**                 | Inverted `¿…?` and `¡…!` at the start of questions/exclamations. Primary quotes `«…»` or `"…"`.                                                                                                  |
| **it**                 | Primary quotes `«…»` or `"…"`.                                                                                                                                                                   |
| **pt-BR**              | Straight quotes `"…"`.                                                                                                                                                                           |
| **pl**                 | Primary quotes `„…"`.                                                                                                                                                                            |
| **cs / sk**            | Primary quotes `„…"`.                                                                                                                                                                            |
| **ro**                 | Primary quotes `„…"`.                                                                                                                                                                            |
| **tr-TR / vi-VN / id** | Straight quotes `"…"`. Vietnamese diacritics are mandatory — never strip (no `bạn` → `ban`).                                                                                                     |
| **ru / ua**            | Primary `«…»`, nested `„…"`.                                                                                                                                                                     |
| **ja**                 | Full-width `。、（）！？・`. Primary quotes 「」, nested 『』. Ellipsis `…` (U+2026), typically doubled as `……`.                                                                                 |
| **ko**                 | Western `. , ? !`; straight quotes `"…"`.                                                                                                                                                        |
| **zh-CN**              | Full-width `。，？！；：`. Primary `"…"`, nested `'…'`. Work titles `《…》`. Half-width space around embedded Latin tokens.                                                                      |
| **zh-TW**              | Full-width `。，？！；：`. Primary `「…」`, nested `『…』`. Work titles `《…》`. Half-width space around embedded Latin tokens.                                                                  |

## Tone & Register (SaaS defaults)

Formality defaults for locales currently in the repo. Add a row for each new locale, consulting the Microsoft Style Guide for that locale as the default authority on product-UI register.

| Locale  | Default "you"                                                                | Notes                                            |
| ------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| fr      | **vous**                                                                     | Never "tu" in product UI                         |
| es      | **usted** + **ustedes**                                                      | Neutral Spanish — no "vosotros", no "tú"         |
| it      | **Lei** (formal third-person)                                                | B2B/enterprise convention                        |
| de      | **Sie**                                                                      | Use infinitive constructions for system messages |
| pt-BR   | **você**                                                                     | Semi-formal default; never "tu"                  |
| pl      | **Pan/Pani** + 3rd-person, or impersonal                                     | Never "ty"                                       |
| cs / sk | **Vy** (formal, 3rd-person plural)                                           | Never "ty"                                       |
| ro      | **dumneavoastră** (formal)                                                   | Or impersonal                                    |
| tr-TR   | **siz** + `-iniz` endings                                                    | Never "sen"                                      |
| vi-VN   | **bạn** (safe neutral)                                                       | Never "mày/tao"; consistency > variety           |
| id      | **Anda** (always capitalized)                                                | Never "kamu" in product UI                       |
| ja      | **です・ます体**                                                             | Never plain form; avoid 尊敬語・謙譲語           |
| ko      | **합니다체** for system/errors; **해요체** acceptable for onboarding         | Match surrounding file                           |
| zh-CN   | **您**                                                                       | B2B convention; never 你                         |
| zh-TW   | **您**                                                                       | B2B convention; never 你                         |
| ru      | **Вы** (cap.) for singular direct address, **вы** (lower) for plural/general | Context-dependent                                |
| ua      | **ви** (lowercase, modern convention)                                        | Capitalized Ви only for very formal              |

General writing rules (apply across all locales):

- Sentence case in buttons, headings, tooltips — not Title Case. Only capitalize proper nouns.
- No exclamation marks except in genuine celebrations (first success, milestone).
- No emoji in UI copy.
- No slang, idioms, humor, cultural references — they don't translate.
- Consistent terminology — if "work item" is used once, never switch to "issue" / "ticket" mid-flow.
- Active voice, present tense.
- Write out abbreviations on first use if not on the DNT list.

## Text Expansion Budget

Design strings knowing translations will grow. Typical expansion vs. English for locales currently in the repo; lookup values from Andiamo / Eriksen / W3C tables when adding a locale.

| Locale       | Expansion                                         | Implication                                     |
| ------------ | ------------------------------------------------- | ----------------------------------------------- |
| de           | +10–35%, single words up to +180%                 | Reserve generous space on buttons, tabs, labels |
| fr           | +15–25%                                           |                                                 |
| es           | +15–30%                                           |                                                 |
| it           | +10–25%                                           |                                                 |
| pt-BR        | +15–30%                                           |                                                 |
| pl           | +20–30%                                           |                                                 |
| cs, sk       | +10–20%                                           |                                                 |
| ro           | +15–25%                                           |                                                 |
| ru, ua       | +15% typical, spikes to +30%                      |                                                 |
| tr-TR        | +10–30% (agglutination)                           |                                                 |
| vi-VN        | +30–40%                                           | Diacritic-heavy, many small words               |
| id           | +10–20%                                           |                                                 |
| ja           | −10 to −55% character count (similar pixel width) |                                                 |
| ko           | −10 to −15%                                       |                                                 |
| zh-CN, zh-TW | −40% character count (≈2× char width)             |                                                 |

Rule of thumb: any UI surface must absorb **+35%** without truncation. If a string is length-capped, add a comment or context in the source.

## Numbers, Dates, Currency, Units

**Never hard-code formats.** Use ICU skeletons so the runtime localizes automatically:

```json
"updated_on": "Updated {date, date, medium}",
"percent_done": "{ratio, number, percent} complete",
"item_count": "{count, number} items"
```

Never write `"{date}MM/DD/YYYY"` in the source — that guarantees a locale bug.

Decimal/thousands separators (runtime-handled):

- en: `1,234.56` — de/it/es/pt-BR/ru/ua/pl/cs/sk/tr-TR: `1.234,56` or `1 234,56` — fr: `1 234,56` (thin space) — ja/ko/zh: `1,234.56`.

Date formats (runtime-handled):

- en-US: `MM/DD/YYYY` — most of Europe: `DD.MM.YYYY` — fr: `DD/MM/YYYY` — ja: `YYYY/MM/DD` or `YYYY年MM月DD日` — zh: `YYYY年MM月DD日` — ko: `YYYY년 MM월 DD일`.

Currency: prefer ISO codes (`USD`, `EUR`, `INR`) in dense UI; localize symbol position via ICU. Units: keep the system (metric/imperial) a product decision, localized consistently.

## AI Translation Workflow

The repo has no machine-readable translation-status field today (no sidecar, no `__meta`, no per-key flag) — so "preserve human-reviewed strings" must be enforced via git history, not status metadata. The disciplines below are what actually fires:

1. **Inject the DNT glossary into every AI translation prompt** — both approved targets and forbidden renderings. LLMs do not natively honor glossaries; they obey them only when prompted.
2. **Prompt the variant explicitly**: `target=zh-CN` vs `target=zh-TW`, `target=pt-BR` vs `target=pt-PT`. Auto-detect calls blend them and produce mixed vocabulary.
3. **Pass 2–5 sentences of real context** per string (surrounding UI, screen, flow). Keep DNT instructions out of context — route them through the glossary/system prompt channel.
4. **Hallucination check**: AI output may add or drop content. Diff placeholder/tag inventory before and after; any mismatch is a reject.
5. **On re-translation, preserve human-touched lines.** Before overwriting any value in an existing locale file, run `git log -- <file>` (or `git blame -L <line>,<line>`) on the key. If the most recent non-bot, non-mass-rewrite commit was authored by a human, treat that line as human-reviewed and keep it. Only overwrite lines whose last edit was a machine sweep or a copy-from-en migration.
6. **Variants by language-resource tier**: expect more review iterations for id, vi-VN, ua, ro (lower-resource LLMs) than for de, fr, es, ja (higher-resource).

### Per-string review rubric (MQM-aligned)

When reviewing a translation — yours or an AI's — score against these categories and reject if any Major issue is present:

1. **Terminology** — DNT violation, inconsistent with the glossary above, or inconsistent with past strings in the same namespace
2. **Accuracy** — Mistranslation, addition (invented content), omission (dropped content), wrong variant (zh-CN vs zh-TW), hallucination
3. **Linguistic** — Grammar, punctuation (per-locale table), spelling, encoding (mojibake, half-width where full-width required)
4. **Style / Register** — Informal pronoun used where formal is required; inconsistent tone; idiom/cultural reference
5. **Locale conventions** — Date / number / currency format hard-coded; decimal separator wrong; keyboard key translated
6. **Markup** — Placeholder changed, HTML tag dropped/modified, Markdown broken, `Trans` numbered fragment renumbered
7. **Plural** — Missing required CLDR form; spurious form the language doesn't have; `#` or `=0` dropped

## Workflow

### Add a new key

1. Add to `packages/i18n/src/locales/en/<namespace>.json` first. (If the namespace file does not yet exist, see **Add a new namespace** below — that case has extra steps.)
2. Use in the component via `t("my.new_key")`.
3. Translate into every target locale present in `src/locales/` — one file at a time. **Do not** copy the English value into the non-English files as a shortcut — `sync-check` treats presence as synced and will silently ship English copy to every locale.
4. Run `pnpm --filter @plane/i18n run generate:types` (or let the build do it).
5. Run `pnpm --filter @plane/i18n run sync:check` — expect `0 missing, 0 stale, 0 collisions`.
6. Spot-check one non-Latin locale manually for punctuation/plural correctness.

### Add a new namespace

A "namespace" is a top-level JSON file (e.g. `common.json`, `auth.json`, `epic.json`). The set of valid namespace names is a hard-coded const array — adding a JSON file alone is not enough; the runtime will not load it.

1. Add the new namespace name to the `NAMESPACES` array in `packages/i18n/src/constants/namespaces.ts`. Keep alphabetical order with the existing entries.
2. Create `<namespace>.json` in **every** locale directory under `packages/i18n/src/locales/` — start with `en/<namespace>.json` (the source of truth), then create the file in all 18 target locales. An empty `{}` is fine for the targets at this step; `sync-check` will report missing keys as you add them in step 4.
3. Add at least one key in `en/<namespace>.json` so the namespace has content.
4. Translate every key from `en/<namespace>.json` into each target locale — apply every rule in this skill.
5. Run `pnpm --filter @plane/i18n run generate:types` to regenerate the `TTranslationKeys` union so component-level `t()` calls type-check.
6. Run `pnpm --filter @plane/i18n run sync:check` — expect `0 missing, 0 stale, 0 collisions`.
7. Use the new namespace from a component via the namespace-prefixed key (e.g. `t("<namespace>.my_key")`) and spot-check the rendered UI in at least one non-Latin locale.

### Update an English value

The meaning changed — every target is now stale even if the key still exists. `sync-check` will **not** flag this.

1. Edit `en/<namespace>.json`.
2. Update the same key in every target locale in the same PR.
3. If a locale has no native speaker available in the PR, mark the string status as `machine_translated` (in PR description or commit message) and open a follow-up for native review.

### Add a new language

1. `cp -r packages/i18n/src/locales/en packages/i18n/src/locales/<xx>`
2. Translate every file, applying every rule in this skill.
3. Register in `packages/i18n/src/constants/language.ts` (`SUPPORTED_LANGUAGES`) and `packages/i18n/src/types/language.ts` (`TLanguage`).
4. Run `sync:check` — must show 100% coverage before merging.
5. Before merging, **pseudolocalize**: temporarily replace the new locale's values with bracketed expanded forms (`"Plane" → "[Plàññéé——]"`) in a local build and click through the UI. Catches truncation, unextracted strings, and layout bugs before real users see them.
6. If the new locale isn't yet covered by this skill (script, plural rules, punctuation, register), follow **Adding a locale not documented here** below and update this file in the same PR.

### Commands

```bash
# Regenerate the TTranslationKeys union (auto on build)
pnpm --filter @plane/i18n run generate:types

# Report drift
pnpm --filter @plane/i18n run sync:check

# Same, exit 1 on drift (for CI)
pnpm --filter @plane/i18n run check:sync
```

## Quick Reference

| Question                                            | Answer                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Translate "Plane" / "Plane AI" / "Power K" / "PQL"? | Never. Latin, every locale.                                                                                                                                            |
| Translate "Sticky" / "Stickies" / "Intake"?         | Never. Plane brand marks. Latin, every locale.                                                                                                                         |
| Translate "Active Cycles"?                          | Never as a unit (it's a feature page name). Lowercase generic "active cycles" in prose translates normally per the glossary.                                           |
| Translate "Pro" / "Business" / "Enterprise"?        | Never. Plan tier names. Latin, every locale.                                                                                                                           |
| Translate "Cycle" / "Module" / "Epic" / "Page"?     | **Yes** — use the per-locale form from the translation glossary (zh-CN 周期/模块/史诗/页面, ja サイクル/モジュール/エピック/ページ, de Zyklus/Modul/Epic/Seite, etc.). |
| Translate "GitHub" / "Slack" / third-party brands?  | Never. Latin, every locale.                                                                                                                                            |
| Translate a variable name `{name}`?                 | Never. Preserve exactly.                                                                                                                                               |
| Translate `<0>…</0>`?                               | Translate only the inside text. Never renumber.                                                                                                                        |
| Russian plural forms?                               | `one / few / many / other` — four forms mandatory; case-correct per CLDR.                                                                                              |
| German plural forms?                                | `one / other` — never `few`.                                                                                                                                           |
| French plural forms?                                | `one / many / other` — `many` covers 1M+.                                                                                                                              |
| CJK plural forms?                                   | `one / other` (single-form) — still emit both.                                                                                                                         |
| Informal "you" in de/fr/ru/ja?                      | Never in product UI.                                                                                                                                                   |
| Chinese + embedded "GitHub"?                        | `使用 GitHub 登录` — half-width space around Latin **brand** tokens. Feature nouns translate (`创建周期`, no space because no Latin).                                  |
| Japanese "user"?                                    | ユーザー with long-vowel ー, not ユーザ.                                                                                                                               |
| Hard-code date formats?                             | Never. Use ICU `{d, date, medium}`.                                                                                                                                    |
| Copy English into non-English locale?               | Never. Worse than leaving the key missing.                                                                                                                             |

## Common Mistakes (revert on sight)

- **Translating Plane brand marks** — `Plane → 飞机`, `Plane AI → AI 聊天`, `Power K → 命令面板`, `Sticky → 便签` (Sticky is a brand, even though "sticky note" generally translates), `Intake → 收件箱`. Brand marks stay Latin.
- **Leaving feature nouns in Latin in non-Latin locales** — `创建 Cycle` (zh-CN), `Создать Cycle` (ru), `エピックを作成` is fine but `Epicを作成` is not. Use the per-locale form from the glossary.
- **Coining new feature-noun translations** — `Cycle → Cercle` (fr — invented; the natural cognate is the same `Cycle`), `Cycle → 循环` (zh-CN — non-glossary; use `周期`), `Epic → Saga` (es — non-glossary; use `Epic`). The glossary is the source of truth.
- **Missing `few` / `many` in Slavic languages** — Russian/Polish/Czech/Slovak/Ukrainian strings with only `one / other` are grammatically wrong for counts 2–4 and 5+. Fix in the same PR.
- **Wrong Slavic case form inside ICU plurals** — for ru/ua, `few` is genitive singular (`# Цикла`), not nominative plural (`# Циклы`). See the case-form table.
- **Inventing `few` in German, `many` in Spanish, etc.** — languages not in CLDR for that form. Remove the spurious keyword.
- **Translating `{count}` or renaming `{name}`** — ICU variables are lookup keys; rename breaks runtime substitution.
- **Dropping `<0>`/`<1>` numbering in `Trans`** — react-i18next matches by number; renumbering breaks the component.
- **Copying English as a translation** — `sync-check` passes, users see English. The fastest way to ship bad i18n.
- **No half-width space around Latin tokens in Chinese** — `使用GitHub登录` is a readability bug. The space rule applies around any remaining Latin token (brand mark), not around translated feature nouns.
- **Missing `ー` in Japanese katakana (`ユーザ` instead of `ユーザー`)** — inconsistent with the Microsoft style guide and the rest of the product.
- **Using informal pronouns** — `du/tu/ты/tú/you (informal)` breaks Plane's formal register in languages that distinguish.
- **Translating keyboard keys** — `Ctrl` stays `Ctrl`, never `Strg` or `コントロール`, because the physical key says `Ctrl`.
- **Hard-coded date/number strings** — `"Due on MM/DD/YYYY"` is a locale bug waiting to ship; use ICU formatters.
- **Translating `PQL`, `SSO`, `API`** — acronyms are DNT. The prose around them may be translated.
- **Translating plan tier names** — `Pro → Профессиональный`, `Business → 商业版`, `Enterprise → エンタープライズ`. Plan tiers stay Latin per industry convention (Notion/Slack/Linear/Asana).
- **Korean particle mismatch after Hangul transliteration** — `사이클를` is wrong (vowel-particle after consonant-ending noun); use `사이클을`. Same for 모듈, 에픽.
- **Vietnamese diacritic stripping** — `bạn` is not `ban`; diacritics are mandatory.
- **Lowercase `anda` in Indonesian** — `Anda` is always capitalized in product UI.
- **Mixing zh-CN and zh-TW vocabulary** — `视频` ≠ `影片`, `软件` ≠ `軟體`. Never copy-paste between the two directories.

## Red Flags — Stop and Revert

You see yourself about to do any of the following → stop, delete, restart this string:

- Replacing `Plane`, `Plane AI`, `Power K`, `PQL`, `Active Cycles`, `Sticky`, `Stickies`, `Intake`, `Pro`, `Business`, `Enterprise`, or any third-party brand (`GitHub`, `Slack`, etc.) with a translated form.
- Leaving `Cycle` / `Module` / `Epic` / `Page` in Latin in a non-Latin locale (zh-CN, zh-TW, ja, ko, ru, ua) — these are common nouns and must be translated per the glossary.
- Coining a feature-noun translation that's not in the glossary (`Cycle → 循环`, `Cycle → Cercle`, `Epic → Saga`).
- Using a vowel-form Korean particle (을/은/이/과 vs. 를/는/가/와) that doesn't agree with the noun's final character.
- Pasting the English value into a non-English file.
- Renaming or removing a `{variable}`, `<tag>`, numbered `<0>`, or Markdown marker.
- Dropping `few` or `many` from a Slavic-language plural, or adding `few` to German.
- Using nominative plural for `few` in ru/ua plural blocks (it should be genitive singular per CLDR).
- Editing one locale file and deciding to "do the others later" without updating the PR description.
- Using `du`, `tu`, `ты`, `tú`, plain-form Japanese, or 반말 Korean in any product string.
- Stripping diacritics from Vietnamese, lowercasing `Anda` in Indonesian.
- Hard-coding a date or number format.

## Rationalizations — Use Reality Column Instead

| Excuse                                                                          | Reality                                                                                                                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Keeping `Cycle` Latin in zh-CN keeps it consistent with English docs."         | That's a minority position; Microsoft, Apple, Mozilla, Notion, Atlassian, Slack all translate. Monolingual zh users can't read Latin words; the glossary form is the standard. |
| "史诗 is the established Chinese word for Epic, but Latin reads more brand-y."  | Brand-y is the wrong goal for a feature noun. The glossary form (`史诗` for zh-CN, `Эпик` for ru) is what users in those locales expect from a SaaS product.                   |
| "Our Russian users understand `Cycle` Latin."                                   | They understand it; they don't expect to encounter it. The glossary form (`Цикл`) is what every other Russian SaaS product uses for the same concept.                          |
| "I'll just transliterate the Plane brand name into Cyrillic for accessibility." | Brand marks stay Latin in every locale. `Плейн` is wrong; `Plane` is right.                                                                                                    |
| "Plan tier names should be translated since they're plain words."               | Industry standard (Notion, Slack, Linear, Asana, GitHub) is to keep `Pro`, `Business`, `Enterprise` Latin for marketing consistency. Don't translate.                          |
| "This string is internal / rarely seen, good-enough is fine."                   | Every string is someone's main screen. Rules are cheap to follow; consistency compounds.                                                                                       |
| "`sync-check` passed, I'm done."                                                | `sync-check` only compares presence, not value quality. Green does not mean translated.                                                                                        |
| "I'll fix the missing plural forms later."                                      | Missing `few` in Russian renders the wrong word for counts 2–4 right now in production. Same PR.                                                                               |
| "The old file already used Latin Cycle everywhere — stay consistent."           | Consistency with a bug is still a bug. Migrate occurrences you touch; open a sweep PR for the rest.                                                                            |
| "AI said this was the right Japanese word for Cycle."                           | AI does not know our glossary unless you inject it. Check against the glossary table above; the glossary wins.                                                                 |
| "The German translation is a bit long but still fits on my screen."             | It won't fit on every user's screen. Design for +35% expansion; test in a narrow viewport.                                                                                     |
| "I renamed `{userName}` to `{nomeUtente}` so the Italian reads naturally."      | Variables are code. The runtime has no `{nomeUtente}` in scope — it renders as literal text. Revert.                                                                           |
| "Capitalizing `Anda` / `您` / `Sie` looks over-formal."                         | It's Plane's register in those languages. Deviating breaks brand voice across the product.                                                                                     |

## Adding a locale not documented here

When you add a language whose script, plural rules, punctuation, or register defaults aren't covered above:

1. **Plural rules** — Look up the target language in the Unicode CLDR Language Plural Rules chart. Note every required keyword (`zero`, `one`, `two`, `few`, `many`, `other`). Add a row to the CLDR table above.
2. **Script & transliteration** — Identify the script family. Latin → preserve DNT verbatim. Non-Latin → decide per-script: transliterate common-noun feature names phonetically (Cyrillic / Devanagari / Greek / Thai), keep brand marks in Latin. For RTL scripts (Arabic, Hebrew, Persian, Urdu) set `dir="rtl"` at the root and ensure Latin tokens remain LTR inside RTL context; preserve `&rlm;`/`&lrm;` markers if present.
3. **Punctuation & spacing** — Consult the Microsoft Style Guide for the locale (canonical authority on SaaS-style product punctuation). Add a row to the Per-Locale Punctuation & Spacing table.
4. **Register** — Default to the formal "you" and whatever honorific/polite register the Microsoft guide prescribes for B2B SaaS. Add a row to the Tone & Register table.
5. **Text expansion** — Look up typical expansion in Andiamo / Eriksen / W3C text-size tables; add a row to the Text Expansion Budget.
6. **DNT glossary** — Add a column (or row entries) for the new locale across the DNT tables. Specify forbidden literal translations (the words an LLM would produce if uninstructed). Example: if adding Arabic, the forbidden rendering for `Plane` includes `طائرة`; for `Epic` includes `ملحمة`; for `Sticky` includes `ملاحظة`.
7. **Commit this file in the same PR** that introduces the locale. The skill must stay ahead of the codebase — empty per-locale rows guarantee inconsistent translations in future PRs.

Canonical references to consult:

- **Unicode CLDR** — plural categories, number/date formats, collation.
- **Microsoft Style Guides** — per-locale register, punctuation, abbreviation handling, trademark rules (90+ locales covered).
- **Mozilla L10n Style Guides** — additional per-locale typography and brand-preservation rules.
- **W3C i18n** — RTL/bidi, placeholder handling, UTF-8, escapes, text expansion.

## References

- Microsoft Localization Style Guides — per-locale definitive source, formal-register defaults
- Unicode CLDR Plural Rules — canonical per-locale plural category list
- Mozilla L10n Style Guides — trademark/brand preservation rules, per-locale typography
- W3C i18n Quick Tips — placeholder handling, text expansion, UTF-8 and escapes
- Google developer style guide "Writing for a global audience" — source-string best practices
- MQM (Multidimensional Quality Metrics) — review rubric used in this skill's `Per-string review rubric` section
- Microsoft AI/LLMs for translation guidance — glossary injection, variant prompting, human-review gates
