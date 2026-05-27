# Verification Checklist

Pre-delivery checklist. Complete before finalizing any case report.

---

## A — Subject Verification

| #   | Check                                                                   | Pass | Notes |
| --- | ----------------------------------------------------------------------- | ---- | ----- |
| A1  | Every subject has a type assigned (person / org / domain / ip / handle) | ☐    |       |
| A2  | Every subject has a confidence score (0–100)                            | ☐    |       |
| A3  | Subjects with confidence < 50 are flagged as UNVERIFIED in report       | ☐    |       |
| A4  | Primary subject identity confirmed by ≥ 2 independent sources           | ☐    |       |
| A5  | Aliases / alternate names documented if found                           | ☐    |       |

---

## B — Finding Verification

| #   | Check                                                                         | Pass | Notes |
| --- | ----------------------------------------------------------------------------- | ---- | ----- |
| B1  | Every finding has: ID, type, weight, source URL, collected timestamp          | ☐    |       |
| B2  | Every CRITICAL or HIGH finding cross-checked against ≥ 1 corroborating source | ☐    |       |
| B3  | No finding labeled CONFIRMED with only 1 source                               | ☐    |       |
| B4  | Contradictory findings are documented and flagged — not silently dropped      | ☐    |       |
| B5  | Findings linked to subject ID (no orphan findings)                            | ☐    |       |

---

## C — Source and Citation Verification

| #   | Check                                                                | Pass | Notes |
| --- | -------------------------------------------------------------------- | ---- | ----- |
| C1  | All source URLs verified live at time of collection                  | ☐    |       |
| C2  | Ephemeral sources (social posts, paste sites) archived before citing | ☐    |       |
| C3  | No shortened URLs cited — expanded form only                         | ☐    |       |
| C4  | Access timestamps recorded for all sources                           | ☐    |       |
| C5  | Chain of custody documented for any screenshots used as findings     | ☐    |       |

---

## D — Coverage Verification

| #   | Check                                                    | Pass | Notes |
| --- | -------------------------------------------------------- | ---- | ----- |
| D1  | Coverage matrix completed for primary subject type       | ☐    |       |
| D2  | All skipped discovery paths have documented reason       | ☐    |       |
| D3  | Null results logged (did not hide empty paths)           | ☐    |       |
| D4  | Coverage score ≥ 60% for primary subject                 | ☐    |       |
| D5  | Any paths not checked due to legal constraints are noted | ☐    |       |

---

## E — Report Verification

| #   | Check                                                                          | Pass | Notes |
| --- | ------------------------------------------------------------------------------ | ---- | ----- |
| E1  | Report format matches intended audience                                        | ☐    |       |
| E2  | Confidence levels stated explicitly — no unqualified factual assertions        | ☐    |       |
| E3  | Limitations section present (what was not checked and why)                     | ☐    |       |
| E4  | No PII of private individuals unless directly relevant and legally permissible | ☐    |       |
| E5  | All cross-references in report point to current file paths                     | ☐    |       |
| E6  | Report classification level assigned and visible                               | ☐    |       |

---

## F — Legal and Ethics Verification

| #   | Check                                                            | Pass | Notes |
| --- | ---------------------------------------------------------------- | ---- | ----- |
| F1  | All collection methods were legal in the applicable jurisdiction | ☐    |       |
| F2  | No unauthorized account access occurred                          | ☐    |       |
| F3  | No pretexting or deception used to obtain information            | ☐    |       |
| F4  | Client authorization (if applicable) documented in case record   | ☐    |       |
| F5  | Case scope not exceeded                                          | ☐    |       |

---

## Checklist Summary

```
Section A (Subject):    ___ / 5
Section B (Findings):   ___ / 5
Section C (Sources):    ___ / 5
Section D (Coverage):   ___ / 5
Section E (Report):     ___ / 6
Section F (Legal):      ___ / 5
────────────────────────────────
Total:                  ___ / 31
```

**Threshold:** All items in Section F must pass. Sections A–E: aim for ≥ 80% (25/31) before delivery.

---

---

## Automated Source Verification — /source-check

Scans all `source_url` values in the active case and reports link health.

### Command

```
/source-check [--fix-broken] [--archive-missing]
```

- `--fix-broken` — attempt to resolve broken URLs via search (update finding if found)
- `--archive-missing` — submit unreachable URLs to Wayback Machine for archival

### Behavior

1. Collect all `source_url` values from every finding in the active case
2. Deduplicate URLs
3. Issue HTTP HEAD request to each URL (5-second timeout)
4. Classify response into one of four states
5. Render ASCII report

### URL Status Classifications

| Status      | Condition                               |
| ----------- | --------------------------------------- |
| Accessible  | HTTP 200                                |
| Redirected  | HTTP 301 / 302 — note final destination |
| Broken      | HTTP 4xx or 5xx                         |
| Unreachable | Connection timeout or DNS failure       |

### Implementation

```python
def source_check(opts=None):
    opts     = opts or {}
    findings = get_active_case().get("findings", [])
    urls     = list({f["source_url"] for f in findings if f.get("source_url")})

    results  = {"accessible": [], "redirected": [], "broken": [], "unreachable": []}

    for url in urls:
        status = http_head(url, timeout=5)
        if status is None:
            results["unreachable"].append(url)
        elif status == 200:
            results["accessible"].append(url)
        elif status in (301, 302):
            results["redirected"].append({"original": url, "final": get_redirect_target(url)})
        else:
            results["broken"].append({"url": url, "status": status})

    if opts.get("fix_broken"):
        for entry in results["broken"]:
            attempt_url_repair(entry["url"])

    if opts.get("archive_missing"):
        for url in results["unreachable"]:
            submit_to_wayback(url)

    return results
```

### ASCII Output Template

```
━━━ SOURCE CHECK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [total] unique sources checked

  Accessible:   [count]  ( [pct]% )
  Redirected:   [count]  ( [pct]% )  — see details below
  Broken:       [count]  ( [pct]% )  — HTTP [codes]
  Unreachable:  [count]  ( [pct]% )  — timeout / DNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REDIRECTED
  [original_url]
    └─ Now: [final_url]

BROKEN
  [url]  HTTP [status]
    └─ Affects findings: [F-id, ...]

UNREACHABLE
  [url]  (timeout)
    └─ Affects findings: [F-id, ...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tip: /source-check --archive-missing to submit unreachable
     URLs to Wayback Machine for citation preservation.
```

---

_See also: [`validation/coverage-matrix.md`](./coverage-matrix.md) | [`validation/quality-scoring.md`](./quality-scoring.md)_
