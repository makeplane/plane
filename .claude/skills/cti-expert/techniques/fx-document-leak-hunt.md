# fx-document-leak-hunt

## Purpose

Find leaked corporate/personal documents across 18 public document-hosting platforms via zero-auth Google dorks. Severity-classify hits, preserve ephemeral content via auto-snapshot, and feed findings into subject registry.

## Quick Reference

| Item       | Detail                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| Command    | `/docleak [TARGET] [--platform list] [--severity high] [--after YYYY-MM-DD]` |
| Input      | Domain, organization name, person name, or username (document-author angle)  |
| Output     | Severity-tiered hit list (CRITICAL/HIGH/MEDIUM/LOW) with source URLs         |
| Confidence | HIGH for indexed + retrievable; MEDIUM for snippet/preview-only (paywalled)  |
| No-auth    | YES — queries search-engine only; never logs into doc platforms              |

## Severity Tiers

| Tier     | Heuristic                                                                                         | Default Trust |
| -------- | ------------------------------------------------------------------------------------------------- | ------------- |
| CRITICAL | Title/filename contains `confidential\|internal\|restricted\|draft\|NDA` + DOMAIN match           | 4             |
| HIGH     | Financial (`earnings\|budget\|forecast\|M&A\|payroll`) or strategic (`roadmap\|strategy\|merger`) | 3             |
| MEDIUM   | Whitepaper / research / patent / technical spec                                                   | 2             |
| LOW      | Marketing brochure / catalog / public presentation / product sheet                                | 1             |

## 18-Platform Mega-Dork

```
"{TARGET}" (site:scribd.com OR site:docplayer.net OR site:slideshare.net OR site:issuu.com OR site:academia.edu OR site:coursehero.com OR site:studocu.com OR site:researchgate.net OR site:medium.com OR site:pdfcoffee.com OR site:pdfcookie.com OR site:vdocuments.net OR site:123dok.com OR site:dokumen.tips OR site:idoc.pub OR site:fliphtml5.com OR site:anyflip.com OR site:calameo.com)
```

**Severity-HIGH filter (append when `--severity high`):**

```
AND (confidential OR internal OR restricted OR draft OR "not for distribution")
```

## Methodology

1. Parse TARGET; normalize DOMAIN (strip `https://`, trailing `/`). For person/org targets, wrap in quotes.
2. Build mega-dork from 18 platforms (default) or `--platform` subset.
3. If `--severity high`: append HIGH-severity keyword filter. Monitor 32-term cap.
4. Dispatch via 4-tier cascade-runner (see [`fx-dork-sweep.md`](fx-dork-sweep.md) §Tools & Fallbacks).
5. Per hit: extract title, uploader handle (if visible in URL/snippet), upload date.
6. Classify severity from title/URL/snippet keywords → tier table above.
7. For paywalled platforms (Scribd, StudoCu, Coursehero): record metadata only; flag `preview_paywalled=true`.
8. For CRITICAL/HIGH tier hits: auto-snapshot via `/snapshots` (Wayback) for preservation before takedown.
9. Handoff retrieved PDFs to [`fx-document-forensics.md`](fx-document-forensics.md) for metadata extraction.
10. `/record-finding` per hit with severity, source URL, tier, trust.

## Platform Profiles

| Platform         | Access            | Upload Date? | Uploader Visible? | Notes                                          |
| ---------------- | ----------------- | ------------ | ----------------- | ---------------------------------------------- |
| scribd.com       | PAYWALLED preview | ✅           | ✅                | High corp-doc density; full content gated      |
| docplayer.net    | OPEN              | ✅           | —                 | Frequent PDF re-hosts of leaked decks          |
| slideshare.net   | OPEN              | ✅           | ✅                | Corp decks; often internal accidentally-public |
| issuu.com        | OPEN              | ✅           | ✅                | Magazines + corp reports                       |
| academia.edu     | LOGIN for full    | ✅           | ✅                | Research + occasional internal leaks           |
| coursehero.com   | PAYWALLED         | ✅           | ✅                | Student uploads; occasional corp training docs |
| studocu.com      | PAYWALLED         | ✅           | —                 | Similar to Coursehero                          |
| researchgate.net | LOGIN for full    | ✅           | ✅                | Research-grade; low false-positive             |
| medium.com       | OPEN              | ✅           | ✅                | Public-by-design; LOW severity default         |
| pdfcoffee.com    | OPEN              | ✅           | —                 | Scraper mirror; often re-hosts leaks           |
| pdfcookie.com    | OPEN              | ✅           | —                 | Scraper mirror                                 |
| vdocuments.net   | OPEN              | ✅           | —                 | Scraper mirror                                 |
| 123dok.com       | OPEN              | ✅           | —                 | Scraper mirror                                 |
| dokumen.tips     | OPEN              | ✅           | —                 | Scraper mirror                                 |
| idoc.pub         | OPEN              | ✅           | —                 | Scraper mirror                                 |
| fliphtml5.com    | OPEN              | ✅           | ✅                | Flipbook format; corp brochures                |
| anyflip.com      | OPEN              | ✅           | ✅                | Similar to fliphtml5                           |
| calameo.com      | OPEN              | ✅           | ✅                | European magazines + corp docs                 |

## Tools & Fallbacks

| Priority | Mechanism                                 | Use                                                    |
| -------- | ----------------------------------------- | ------------------------------------------------------ |
| 1        | WebSearch(mega-dork)                      | Default dispatch — Google-proxied, safest              |
| 2        | WebFetch(bing.com/search?q=...)           | Fallback on T1 rate-limit; Bing indexes doc-hosts well |
| 3        | WebFetch(html.duckduckgo.com/html/?q=...) | Third-tier fallback                                    |
| 4        | agent-browser or ck:chrome-profile        | Paywall-preview screenshot capture (metadata only)     |

Full cascade semantics: [`fx-dork-sweep.md`](fx-dork-sweep.md) §Tools & Fallbacks.

## False Positive Triage

- Generic marketing brochure coincidentally mentioning TARGET → downgrade to LOW.
- SEO-stuffed scraper mirror re-hosting unrelated content → verify against original platform; mark as mirror.
- Auto-generated summary pages (common on coursehero/studocu) → not real documents.
- Old public brochures labeled "confidential" as boilerplate → require DOMAIN match in body for CRITICAL.
- Uploader=TARGET's own marketing team → re-classify LOW regardless of keyword.

## Output Format

```
DocLeak Sweep: "Acme Corp"  [--severity high]
Cascade: T1 (38 hits) → dedup → 24 unique
Platforms hit: 11/18

CRITICAL (4):
  - scribd.com/document/xyz — "Acme_2024_Internal_Budget_DRAFT.pdf"   [paywalled preview]
  - issuu.com/acme-marketing/docs/merger-roadmap-q3                    [RETRIEVED → forensics]
  - slideshare.net/jdoe/acme-restructuring-confidential                [RETRIEVED, uploader=jdoe]
  - pdfcoffee.com/acme-corp-salary-sheet-pdf-free                      [RETRIEVED, mirror]

HIGH (6):
  - slideshare.net/acme/q2-earnings-internal
  - researchgate.net/publication/acme-forecast-2025
  - …

MEDIUM (8):  whitepapers, research, patent filings

LOW (6):  public marketing, press decks

Auto-snapshots: 4 (CRITICAL tier → Wayback preservation)
Paywalled: 3 (metadata only)
Evidence: subject-registry logged
```

## Limitations

- Paywall opacity — Scribd/StudoCu/Coursehero preview only; full retrieval requires login (out of scope).
- Platform deletions — uploader can delete post-index; snapshot at first discovery.
- Region-locked content — some EU platforms (Calameo) geo-gate; VPN out of scope.
- False uploader attribution — "uploaded by X" doesn't mean X authored the doc.
- Scraper mirrors often lag original deletions by months — stale leaks appear "fresh."

## Related Techniques

- [fx-dork-sweep.md](fx-dork-sweep.md) — parent sweeper and cascade-runner.
- [fx-document-forensics.md](fx-document-forensics.md) — post-retrieval PDF/Office metadata extraction.
- [fx-metadata-parsing.md](fx-metadata-parsing.md) — EXIF / author / revision history.
- [fx-leak-monitoring.md](fx-leak-monitoring.md) — persistent alerting over these platforms.
