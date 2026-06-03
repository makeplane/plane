# fx-dork-sweep

## Purpose

Execute zero-auth Google-style dork sweeps across Telegram ecosystem, document-hosting platforms, and target-domain filetypes. Builds precision queries, runs through a 4-tier fallback cascade (WebSearch → Bing → DuckDuckGo → agent-browser), deduplicates hits, and records findings to subject registry.

## Quick Reference

| Item       | Detail                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Command    | `/dork-sweep [TARGET] [--telegram\|--docs\|--filetype\|--all] [--after YYYY-MM-DD] [--before YYYY-MM-DD] [--clean]` |
| Input      | Keyword, domain, email, username, phone, or person name                                                             |
| Output     | Deduplicated ranked hit list + evidence URLs; findings logged with trust score                                      |
| Confidence | HIGH for indexed content verified via ≥2 tiers; MEDIUM for snippet-only                                             |
| No-auth    | YES — zero API keys, zero logins                                                                                    |

## Methodology

1. Parse TARGET; wrap multi-word inputs in `"..."`. URL-encode for direct-URL tiers.
2. Select dork family/families from flags (default `--all`):
   - `--telegram` → 13-site Telegram ecosystem mega-dork (see [operator-queries.md#telegram-ecosystem](../handbook/operator-queries.md))
   - `--docs` → 18-site document-hosting mega-dork (below)
   - `--filetype` → target-domain filetype sweep (requires DOMAIN target)
3. Apply `--after`/`--before` date bounds (T1/T4 use Google syntax; T2 Bing uses `&from=YYYYMMDD&to=YYYYMMDD` URL param).
4. Apply `--clean` noise-reduction tail (see Noise Reduction block).
5. Count OR-terms; if >30 → split per 32-Term Splitter rule.
6. Dispatch via cascade-runner (Tools & Fallbacks below).
7. Classify hits: indexed+retrievable=HIGH, snippet-only=MEDIUM, cached/mirror=LOW.
8. Cross-engine dedup (URL canonicalization).
9. `/record-finding` per hit: source URL, collection tier, trust score (3 single-tier, 4 cross-tier match).
10. For Doc-host hits with severity concern → handoff to [`fx-document-leak-hunt.md`](fx-document-leak-hunt.md).

## Dork Library

**Telegram ecosystem** — canonical form in [`handbook/operator-queries.md`](../handbook/operator-queries.md) (Cross-Platform Mega-Dorks § Telegram ecosystem). Do not duplicate.

**Document-hosting (18 platforms):**

```
"{TARGET}" (site:scribd.com OR site:docplayer.net OR site:slideshare.net OR site:issuu.com OR site:academia.edu OR site:coursehero.com OR site:studocu.com OR site:researchgate.net OR site:medium.com OR site:pdfcoffee.com OR site:pdfcookie.com OR site:vdocuments.net OR site:123dok.com OR site:dokumen.tips OR site:idoc.pub OR site:fliphtml5.com OR site:anyflip.com OR site:calameo.com)
```

**Target-domain filetype:**

```
site:{DOMAIN} (filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xls OR filetype:xlsx OR filetype:ppt OR filetype:pptx OR filetype:txt OR filetype:csv OR filetype:xml)
```

**Noise Reduction (`--clean` tail):**

```
-site:pinterest.com -site:reddit.com -site:twitter.com -inurl:cache -inurl:webcache -inurl:translate
```

## 32-Term Splitter

Google OR-chains cap at ~32 terms. Count sites + filetypes + keywords. If >30 → split into balanced halves, dispatch as separate queries, merge results with URL dedup.

- Safe: 18-site doc-host OR-chain (19 terms incl. target) → single query.
- Overflow: doc-host + paste + code chains combined (40+ terms) → split into 3 queries.

## Tools & Fallbacks — Cascade-Runner (4 Tiers)

Invoke tiers sequentially. Escalate only on failure signal. Add 2s delay between tier transitions.

| Operator           | T1 WebSearch |        T2 Bing         | T3 DDG | T4 Browser |
| ------------------ | :----------: | :--------------------: | :----: | :--------: |
| `site:`            |      ✅      |           ✅           |  ~✅   |     ✅     |
| `filetype:`        |      ✅      |           ✅           |  ~✅   |     ✅     |
| `inurl:`           |      ✅      |           ❌           |  ~✅   |     ✅     |
| `intitle:`         |      ✅      |           ✅           |  ~✅   |     ✅     |
| `intext:`          |      ✅      |          ~✅           |   ❌   |     ✅     |
| `OR` chains        |      ✅      |           ✅           |  ~✅   |     ✅     |
| `after:`/`before:` |      ✅      | ❌ (use &from/&to URL) |   ❌   |     ✅     |

**If query contains `inurl:` → skip T2; go T1 → T3 → T4.**

**Tier 1 — WebSearch (default):**

```
# Invocation: WebSearch(query="QUERY")
# Success: non-empty results array
# Failure: rate-limit error OR empty after retry
# Transition: sleep 2s → Tier 2
```

**Tier 2 — Bing direct URL via WebFetch:**

```
# URL: https://www.bing.com/search?q={URLENC_QUERY}
# Invocation: WebFetch(url, prompt="extract organic result URLs and snippets")
# User-Agent: rotate from UA pool (below) every 3 queries
# Success: HTML contains <li class="b_algo">
# Failure: CAPTCHA page OR zero results
# Transition: Tier 3
# OPERATOR NOTE: inurl: NOT SUPPORTED — skip tier for inurl queries
```

**Tier 3 — DuckDuckGo HTML:**

```
# URL: https://html.duckduckgo.com/html/?q={URLENC_QUERY}
# Method: POST (body: q={URLENC_QUERY})
# Invocation: WebFetch(url, prompt="extract result URLs from class='result__url'")
# Success: parsed results >0
# Failure: operator not applied (heuristic: 0 results on narrow dork)
# Transition: Tier 4
```

**Tier 4 — agent-browser or project browser (last resort):**

```
# Tool: agent-browser when no real Chrome login state is needed; ck:chrome-profile only for real user Chrome cookies
# Mode: headless=false, user-data-dir=persistent for cookie warmth
# Invocation: navigate to https://www.google.com/search?q={URLENC}
# Evidence: mandatory screenshot at results page
# Failure: CAPTCHA prompt → log collection-gap, do NOT retry
```

**User-Agent pool (rotate every 3 Tier-2 queries):**

- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36`
- `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/128.0`
- `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36`
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/126.0.0.0`
- `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.5`

**Rate-limit discipline:** 2s between T1 queries, 5s between T2 queries. Rotate UA every 3 T2 queries. T4 single-shot only.

## False Positive Triage

- Cached/translated pages (`webcache.googleusercontent.com`, `translate.google.com`) — re-check via direct URL.
- CDN mirrors re-hosting indexed content — verify canonical source.
- archive.org re-hosts appearing as "new" hits — flag as historical.
- SEO-stuffed scraper mirrors (especially dokumen.tips, 123dok) — verify against original platform.
- Keyword-stuffed pages coincidentally containing TARGET — require ≥2 anchor terms for HIGH trust.

## Output Format

```
Dork Sweep: acme-corp.com  [--filetype --clean]
Cascade: T1 WebSearch (42 hits) → dedup → 28 unique
Splits: 1 (no overflow)

HIGH (indexed, ≥2-tier confirmed):
  - https://acme-corp.com/docs/2024-budget.pdf  [filetype:pdf]
  - https://acme-corp.com/internal/roadmap.xlsx [filetype:xlsx]

MEDIUM (snippet-only):
  - https://acme-corp.com/archive/memo.doc [filetype:doc]

LOW (mirror/cache):
  - cached: webcache.googleusercontent.com/... → flag for manual review

Collection Gaps: 0
Evidence: subject-registry logged (case=C-2026-0419-a)
```

## Limitations

- Google OR-chain 32-term cap → splitting required for mega-combinations.
- CAPTCHA risk on T2/T4 even with UA rotation; T1 proxied safest.
- Document-host paywalls (Scribd/StudoCu/Coursehero) hide full content → snippet/metadata only.
- Indexing lag: hours to weeks between upload and discoverability.
- Ephemeral pastes deleted before indexing are invisible.
- Bing `inurl:` unsupported since 2007 → cascade routes to T1/T3/T4.

## Related Techniques

- [fx-document-leak-hunt.md](fx-document-leak-hunt.md) — severity classifier for doc-host hits.
- [fx-leak-monitoring.md](fx-leak-monitoring.md) — continuous alerting over the same dork surface.
- [fx-breach-discovery.md](fx-breach-discovery.md) — credential-focused dorks.
- [secret-scanning.md](secret-scanning.md) — code-repo secrets dorks.
- Handbook: [operator-queries.md](../handbook/operator-queries.md) — canonical dork library.
