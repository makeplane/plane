# Archive Explorer

Techniques for recovering subject history from web archives. Primary tool: **waymore** (multi-source archive mining). Secondary: Common Crawl API, Internet Archive CDX, Archive.today.

---

## Source Priority

| Source                        | Coverage                         | Reliability | Best For                        |
| ----------------------------- | -------------------------------- | ----------- | ------------------------------- |
| Common Crawl                  | Broad web, frequent crawls       | Medium-High | Domain content, public pages    |
| Internet Archive Wayback      | Deep historical, social profiles | High        | Timeline reconstruction         |
| Archive.today                 | Snapshot-on-demand, JS-rendered  | High        | Current snapshots, social posts |
| Google cache                  | Last crawl only                  | Low         | Recent content, quick check     |
| Cached APIs (Twitter, Reddit) | Platform-specific                | Medium      | Social content before deletion  |

---

## 0. Waymore — Primary Archive Mining Tool

**waymore** (https://github.com/xnl-h4ck3r/waymore) queries 7 archive sources simultaneously and optionally downloads archived response bodies for deep content analysis. Replaces manual querying of individual archive APIs.

**Install:** `pip3 install waymore`

**Sources queried (all 7):**

1. Wayback Machine (web.archive.org)
2. Common Crawl (106+ index collections)
3. AlienVault OTX (otx.alienvault.com)
4. URLScan (urlscan.io — requires free API key)
5. VirusTotal (virustotal.com)
6. GhostArchive (ghostarchive.org)
7. Intelligence X (intelx.io — paid tiers)

**Key CLI patterns:**

```bash
# Get all archived URLs for a domain (including subdomains):
waymore -i <domain> -mode U -oU waymore-urls.txt

# Get URLs only for the base domain (no subs):
waymore -i <domain> -mode U -n -oU waymore-urls.txt

# Download archived response bodies (for content mining):
waymore -i <domain> -mode R -oR ./waymore-responses/

# Both URLs and responses:
waymore -i <domain> -mode B -oU waymore-urls.txt -oR ./waymore-responses/

# Filter by date range:
waymore -i <domain> -mode U -from 2020 -to 2024 -oU waymore-urls.txt

# Filter by MIME type (e.g., only HTML):
waymore -i <domain> -mode U -mt text/html -oU waymore-urls.txt

# Keywords-only mode (faster — regex filter):
waymore -i <domain> -mode U -ko "api|admin|login|password" -oU waymore-urls.txt

# Limit Common Crawl collections queried (speed vs coverage):
waymore -i <domain> -mode U -lcc 5 -oU waymore-urls.txt
```

**Why waymore over GAU:**

- Queries 7 sources vs GAU's 4 (Wayback, OTX, Common Crawl, URLScan)
- Downloads actual response bodies, not just URL listings
- Handles rate limiting with retries and backoff
- Outputs deduplicated, filterable results
- Supports date-bounded and MIME-filtered queries

**Fallback:** If waymore unavailable, use GAU + manual Wayback CDX queries as documented below.

---

## 1. Common Crawl Access

Common Crawl provides petabyte-scale raw web data and an index API. Prefer over Wayback for breadth; use Wayback for depth on specific URLs.

**CDX Index API (Common Crawl):**

```
https://index.commoncrawl.org/CC-MAIN-{YYYY-MM}/cdx?url={domain}&output=json
```

Available crawl indexes: quarterly releases, labeled `CC-MAIN-YYYY-WW`.

```python
def query_commoncrawl(url, crawl_id="CC-MAIN-2024-10"):
    endpoint = f"https://index.commoncrawl.org/{crawl_id}/cdx"
    params = {
        "url": url,
        "output": "json",
        "fields": "timestamp,url,mime,status,filename,offset,length"
    }
    response = requests.get(endpoint, params=params)
    return [json.loads(line) for line in response.text.strip().split('\n')]

# Fetch the actual WARC content:
def fetch_warc_record(filename, offset, length):
    warc_url = f"https://data.commoncrawl.org/{filename}"
    headers = {"Range": f"bytes={offset}-{offset+length-1}"}
    return requests.get(warc_url, headers=headers)
```

---

## 2. Internet Archive CDX API

The CDX API returns structured capture metadata. More granular than the Wayback UI.

**All captures for a URL:**

```
https://web.archive.org/cdx/search/cdx?url={url}&output=json&limit=500
```

**Date-bounded capture list:**

```
https://web.archive.org/cdx/search/cdx?url={url}&from={YYYYMMDD}&to={YYYYMMDD}&output=json
```

**Filter by HTTP status:**

```
https://web.archive.org/cdx/search/cdx?url={url}&filter=statuscode:200&output=json
```

**Snapshot URL formats:**

| Format       | URL Pattern         | Purpose                          |
| ------------ | ------------------- | -------------------------------- |
| Standard     | `web/{ts}/{url}`    | As captured with Wayback toolbar |
| Clean        | `web/{ts}if_/{url}` | No injected Wayback JS           |
| Text extract | `web/{ts}id_/{url}` | Raw text, no assets              |

---

## 3. Social Platform Archive Patterns

| Platform    | Wayback Pattern                                                  |
| ----------- | ---------------------------------------------------------------- |
| Twitter / X | `web/*/https://twitter.com/{handle}` or `/status/{id}`           |
| Instagram   | `web/*/https://www.instagram.com/{handle}/` or `/p/{shortcode}/` |
| Reddit      | `web/*/https://www.reddit.com/user/{username}/`                  |
| LinkedIn    | `web/*/https://www.linkedin.com/in/{slug}/`                      |
| Facebook    | `web/*/https://www.facebook.com/{username}`                      |

---

## 4. Timeline Reconstruction

Build a chronological event log from archive captures.

**Phase 1 — Capture inventory:**

```python
def collect_captures(url):
    captures = query_wayback_cdx(url)
    captures += query_commoncrawl(url)
    return deduplicate_by_timestamp(captures)
```

**Phase 2 — Event classification:**

```python
EVENT_TYPES = {
    "first_seen":        lambda c: c.is_earliest,
    "profile_update":    lambda c: profile_fields_changed(c, prev),
    "content_added":     lambda c: new_posts_detected(c, prev),
    "content_removed":   lambda c: posts_missing_vs_prev(c, prev),
    "username_change":   lambda c: c.handle != prev.handle,
    "archive_gap":       lambda c: days_since_prev(c, prev) > 30,
    "account_suspended": lambda c: c.http_status in (404, 302) and prev.status == 200,
}
```

**Phase 3 — Timeline format:**

```
{YYYY-MM-DD} [EVENT_TYPE] description — confidence X%
```

Example:

```
2019-02-14 [FIRST_SEEN]     Account created (earliest capture)
2019-08-03 [CONTENT_ADDED]  Campaign posts begin (12 posts in 1 week)
2020-04-17 [PROFILE_UPDATE] Username: handle_A → handle_B
2020-11-22 [CONTENT_REMOVED] 8 posts deleted — archived copies available
2021-06-30 [ARCHIVE_GAP]    47-day gap — possible suspension
2021-08-16 [FIRST_SEEN]     Account re-appears under handle_B
```

---

## 5. Domain Archive Exploration

**Registration history:**

```
site:web.archive.org {domain} whois
site:domaintools.com/research/whois-history/search/ (manual)
```

**DNS record history:**

```
site:securitytrails.com/domain/{domain}/history/a
site:viewdns.info/iphistory/?domain={domain}
```

**Subdomain discovery via archives:**

```python
def find_subdomains_in_archive(domain):
    cdx_url = f"https://web.archive.org/cdx/search/cdx?url=*.{domain}&output=json&fl=original"
    results = requests.get(cdx_url).json()
    return set(extract_subdomain(r[0]) for r in results[1:])
```

---

## 6. Authenticity Verification

Before citing archive content as a finding:

| Check                     | Method                                                    |
| ------------------------- | --------------------------------------------------------- |
| Timestamp integrity       | Verify timestamp in URL matches page date references      |
| Wayback injection         | Look for Wayback toolbar HTML; use `if_` variant to strip |
| Cross-archive consistency | Same content in Archive.today and Common Crawl            |
| Image hash validation     | Compare archived images to other sources                  |

Source confidence: Wayback 88%, Archive.today 83%, Common Crawl 76%, Google cache 58% (ephemeral).

---

## 7. Recovery Dorks

```
# Find archived copies of a specific URL
site:web.archive.org "{target_url}"
site:archive.today "{target_url}"

# Find archived content by keyword
site:web.archive.org "{exact_phrase}" "{domain}"

# Recover deleted page (exists in archive, 404 now)
site:web.archive.org/web/*/https://{domain}/{path}

# Find historical mentions of username
site:web.archive.org "{handle}" site:{platform}.com
```

---

## Cross-References

- `analysis/drift-monitor.md` — triggers archive recovery on DRIFT_CRITICAL
- `techniques/deletion-recovery.md` — multi-source recovery workflow
- `engine/archive-cache.md` — local snapshot storage

---

## 8. Snapshot Listing

```
/snapshots [url] [--from YYYY] [--to YYYY]
```

Lists all available Wayback Machine snapshots for a URL with timestamps and HTTP status codes. Useful for identifying capture density, finding the earliest/latest record, and selecting specific versions for diff comparison.

**Options:**

| Option        | Default            | Description                 |
| ------------- | ------------------ | --------------------------- |
| `[url]`       | required           | Full URL or domain to query |
| `--from YYYY` | earliest available | Start year filter           |
| `--to YYYY`   | current year       | End year filter             |

**Implementation — Wayback CDX API:**

```bash
# Via waymore (preferred — multi-source):
waymore -i <url> -mode U -from <YYYY> -to <YYYY> -oU snapshots.txt

# Direct CDX fallback:
curl "https://web.archive.org/cdx/search/cdx?url=<url>&from=<YYYYMMDD>&to=<YYYYMMDD>&output=json&fl=timestamp,statuscode,mimetype&limit=200"
```

**Output format:**

```
SNAPSHOTS — {url}
Range: {from_year} → {to_year}  |  Total captures: {n}
════════════════════════════════════════════════════════════
  Timestamp (UTC)      Status  MIME
  ──────────────────   ──────  ──────────────────
  2019-02-14 08:03     200     text/html
  2019-08-22 14:17     200     text/html
  2020-04-11 03:55     301     —
  2021-06-30 09:40     404     —
  2023-11-05 16:22     200     text/html
  ...
════════════════════════════════════════════════════════════
First capture : {earliest_timestamp}
Last capture  : {latest_timestamp}
Status 200    : {n_200}  |  3xx: {n_3xx}  |  4xx/5xx: {n_err}
```

Status codes are color-coded in terminal: 200 green, 3xx yellow, 4xx/5xx red.

---

## 9. Archive Content Diff

```
/diff [url] [--from <date>] [--to <date>]
```

Fetches two archived versions of a URL and computes a text diff, highlighting significant content changes. Used to detect when sensitive information was added or removed, page structure shifts, or content manipulation.

**Options:**

| Option          | Default           | Description                                                 |
| --------------- | ----------------- | ----------------------------------------------------------- |
| `[url]`         | required          | URL to compare                                              |
| `--from <date>` | earliest snapshot | Date of the "before" version (YYYY-MM-DD or YYYYMMDDHHMMSS) |
| `--to <date>`   | latest snapshot   | Date of the "after" version                                 |

If exact timestamps are not provided, the nearest available snapshot to each date is used.

**Implementation:**

```python
def fetch_clean_snapshot(url, timestamp):
    # Use if_ variant to strip Wayback toolbar injection
    wayback_url = f"https://web.archive.org/web/{timestamp}if_/{url}"
    resp = requests.get(wayback_url, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove script/style noise
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)

def compute_diff(text_before, text_after):
    import difflib
    lines_a = text_before.splitlines(keepends=True)
    lines_b = text_after.splitlines(keepends=True)
    return list(difflib.unified_diff(lines_a, lines_b, lineterm=""))
```

**ASCII diff report:**

```
ARCHIVE DIFF — {url}
Before : {from_timestamp} (snapshot {wayback_ts_a})
After  : {to_timestamp}   (snapshot {wayback_ts_b})
════════════════════════════════════════════════════════════
Changes: +{lines_added} added  -{lines_removed} removed  ~{lines_changed} modified

SIGNIFICANT CHANGES (flagged by keyword heuristic):
  [+] Line 42  : "Contact: admin@newdomain.com"          ← email added
  [-] Line 87  : "Hosted by: LegitProvider Inc"          ← provider removed
  [+] Line 103 : "Terms updated: 2023-11-01"             ← date change

FULL DIFF (unified format):
--- before  {wayback_ts_a}
+++ after   {wayback_ts_b}
@@ -{from_line},{ctx} +{to_line},{ctx} @@
 unchanged context line
-removed line
+added line
 unchanged context line
════════════════════════════════════════════════════════════
```

**Significance heuristic** — flags lines containing: email patterns, IP addresses, domain names, dates, phone numbers, monetary values, credential keywords (`password`, `token`, `key`, `secret`).

**Cross-references:**

- `/snapshots` — use first to identify candidate timestamps before running `/diff`
- `analysis/drift-monitor.md` — automated diff triggers on DRIFT_CRITICAL
- `engine/finding-framework.md` — significant diff changes create findings with type `infrastructure`
