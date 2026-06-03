# Citation Guide

Source attribution standards for case reports. Table-first reference.

---

## Quick Reference — Source Type → Format

| Source type              | Required fields                                 | Archive needed |
| ------------------------ | ----------------------------------------------- | -------------- |
| Webpage                  | Author, title, site, date, URL                  | Yes            |
| Social media post        | Handle, platform, date, URL                     | Yes            |
| Profile (LinkedIn, etc.) | Name, platform, URL, accessed date              | Yes            |
| WHOIS record             | Registrar, domain, query date, URL              | Yes            |
| Public record (gov)      | Agency, record type, date, URL                  | Recommended    |
| News article             | Author, headline, outlet, date, URL             | Yes            |
| Court document           | Case name, citation, court, year, URL           | No (PACER)     |
| Forum/paste              | Handle or Anon, site, date, URL                 | Yes            |
| Archived snapshot        | Original citation + archive URL + snapshot date | —              |

---

## Format Styles

### Inline (default for OSINT reports)

```
[Source label] Author. "Title." Site, Date. URL (archived: archive-URL, DATE).
```

**Webpage example:**

```
[W-01] Kim, R. "Open ports on fintech infrastructure." TechTrace, 2026-01-12.
       https://techtrace.io/ports-fintech (archived: https://web.archive.org/..., 2026-01-12)
```

**Social post example:**

```
[S-01] @handle_xyz. "Post text first 20 words..." Platform, 2026-02-05 14:33.
       https://platform.com/handle_xyz/status/123456 (archived: ..., 2026-02-05)
```

**WHOIS example:**

```
[W-02] ICANN WHOIS. "Record for target-domain.com." Queried 2026-03-01.
       https://lookup.icann.org/en/lookup?name=target-domain.com
```

**Public record example:**

```
[P-01] Delaware SoS. "Acme Holdings LLC — entity registration." Accessed 2026-03-15.
       https://icis.corp.delaware.gov/...
```

**Court document example:**

```
[C-01] Smith v. Acme Corp, 45 F.Supp.4d 112 (D. Del. 2025).
       https://courtlistener.com/opinion/99001/
```

---

## Ephemeral Content Rules

Content that may disappear (social posts, paste sites, live pages):

1. Archive with Wayback Machine before citing
2. Record: original URL, archive URL, archive timestamp
3. If content deleted after archiving, note: `[original deleted — archive only]`
4. Screenshot as fallback (attach to evidentiary report, note capture date/time)

---

## Confidence Tagging

Append confidence tag after each citation in full-analysis reports:

| Tag              | Meaning                                       |
| ---------------- | --------------------------------------------- |
| `[CONFIRMED]`    | Independently verified by 2+ sources          |
| `[CORROBORATED]` | Consistent with other findings, single source |
| `[UNVERIFIED]`   | Single source, not cross-checked              |
| `[SUSPECT]`      | Source reliability questionable               |

---

## URL Policy

| Rule                                                  | Action                                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| **Every reference MUST include a full clickable URL** | **MANDATORY — never cite a source without its URL**    |
| Shortened URLs (bit.ly, etc.)                         | Expand before citing — never cite short form           |
| UTM/tracking params                                   | Strip before citing                                    |
| URLs with credentials/tokens                          | Redact — cite `[URL redacted — contained credentials]` |
| Private / internal URLs                               | Note `[not publicly accessible]`                       |
| Redirecting URLs                                      | Cite final destination, note redirect chain            |

### CRITICAL: No Text-Only References

**Every person, profile, company, or entity mentioned in a report MUST include the actual URL where the information was found.** Text-only labels like "LinkedIn John Doe" or "Twitter @handle" are PROHIBITED — they must always include the full URL.

**BAD (text-only, no URL):**

```
LinkedIn Hung Tran — Senior Developer at Acme Corp
```

**GOOD (with full clickable URL):**

```
[LinkedIn Hung Tran](https://www.linkedin.com/in/hung-tran) — Senior Developer at Acme Corp
   Source: https://www.linkedin.com/in/hung-tran (accessed 2026-03-30)
```

**For profiles:**

```
Platform: LinkedIn
Name: Hung Tran
URL: https://www.linkedin.com/in/hung-tran
Accessed: 2026-03-30
```

**For search results:**

```
Finding: Subject has GitHub account with 47 repositories
URL: https://github.com/username
Accessed: 2026-03-30
```

This rule applies to ALL report formats (INTSUM, Brief, Quick, Legal, JSON, CSV) without exception.

---

## Chain of Custody (Evidentiary reports only)

```
Finding ID:  F-012
Source:      [W-03] per citation above
Collected:   2026-03-10 08:44 UTC  by: analyst-01
Archived:    https://web.archive.org/web/20260310084400/...
Screenshot:  attached as Exhibit-F012.png  hash: sha256:abc123...
Notes:       page modified between collection and archive; screenshot governs
```

---

_See also: [`output/reports/format-catalog.md`](./format-catalog.md)_
