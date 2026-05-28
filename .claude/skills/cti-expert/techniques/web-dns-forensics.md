# Web & DNS Forensics Module

> **Module ID:** WEB-DNS-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Web Platform & DNS Investigation Techniques

---

## 1. Overview

Techniques for extracting intelligence from web platforms, DNS records, and online services. Covers Google Docs/Sheets enumeration, DNS zone transfers, Tor relay lookups, GitHub repository analysis, Telegram bot investigation, FEC research, WHOIS deep investigation, and Google Image advanced filters.

---

## 2. Google Image TBS Filters

Append `&tbs=` parameters to Google Image search URLs for precision filtering:

| Filter         | Parameter               | Use Case                              |
| -------------- | ----------------------- | ------------------------------------- |
| Faces only     | `itp:face`              | Profile photos — strips logos/banners |
| Clipart        | `itp:clipart`           | Logos, icons                          |
| Animated GIF   | `itp:animated`          | Animated images                       |
| Specific color | `ic:specific,isc:green` | Dominant color filter                 |
| Transparent BG | `ic:trans`              | PNGs with transparency                |
| Large images   | `isz:l`                 | High resolution only                  |
| Min resolution | `isz:lt,islt:2mp`       | Greater than 2 megapixels             |

**Combined example — LinkedIn face photos:**

```
https://www.google.com/search?q="company"+"intern"+site:linkedin.com&tbm=isch&tbs=itp:face
```

The `itp:face` filter is especially useful — combine with `site:` and `after:YYYY-MM-DD` for targeted recon.

---

## 3. Google Docs/Sheets Enumeration

When targets share Google Docs/Sheets links, try these access URLs:

| URL Suffix             | Purpose                      |
| ---------------------- | ---------------------------- |
| `/export?format=csv`   | Export as CSV                |
| `/pub`                 | Published version            |
| `/gviz/tq?tqx=out:csv` | Visualization API CSV export |
| `/htmlview`            | HTML view                    |

Sheet IDs are stable identifiers even if sharing settings change. Private sheets require authentication.

### 3.1 Xeuledoc — Google Document Metadata Extraction

**Tool:** [xeuledoc](https://github.com/Malfrats/xeuledoc) (Python, GPLv3)

Extracts metadata and permissions from any publicly shared Google document without authentication. Queries Google Drive's internal API using the document ID.

**Supported document types:** Docs, Sheets, Slides, Drawings, Drive files, My Maps, Apps Script, Jamboard.

**Installation:**

```bash
pip3 install xeuledoc
```

**Usage:**

```bash
# Analyze any Google document share link
xeuledoc "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
```

**Extracted data:**

| Field              | Forensic Value                         | Confidence |
| ------------------ | -------------------------------------- | ---------- |
| Document ID        | Persistent identifier (33 or 44 chars) | HIGH       |
| Creation date      | Document origin timestamp (UTC)        | HIGH       |
| Last edit date     | Most recent modification (UTC)         | HIGH       |
| Public permissions | Viewer/editor/commenter roles          | HIGH       |
| Owner name         | Document creator identity              | HIGH       |
| Owner email        | Creator email address                  | HIGH       |
| Owner Google ID    | Persistent Google account identifier   | HIGH       |

**OSINT value:**

- Reveals document owner identity (name, email, Google ID) even when the doc itself shows no author
- Creation vs edit date gap exposes document lifecycle and editing patterns
- Public permissions reveal whether the target intentionally shared or misconfigured access
- Owner Google ID is a persistent identifier useful for cross-referencing across Google services

**Integration with case model:**

- Owner email → register as EMAIL subject → feed to `/email-deep` and `/breach-deep`
- Owner name → register as PERSON subject → feed to `/username` enumeration
- Document → register as ASSET subject with `owns` connection to owner
- Timestamps → feed to `/timeline`

**Fallback cascade:**

1. xeuledoc (primary — automated, structured output)
2. Manual Google Drive API query with document ID (secondary)
3. Google cache / Wayback Machine snapshot of the document (tertiary)

**Limitations:**

- Only works on public or anyone-with-link documents; private docs return error
- Rate-limited by Google — automatic retries (up to 100) with progress display
- Metadata can theoretically be manipulated; treat as findings, not ground truth

---

## 4. DNS Zone Transfers & TXT Record OSINT

### Zone Transfer Attempt

```bash
dig axfr @ns.domain.com domain.com
```

### TXT Record Mining

```bash
dig -t txt subdomain.ctf.domain.com
dig -t txt _dmarc.domain.org
dig -t any domain.org
```

**Key insight:** DNS TXT records are publicly queryable. Always check TXT, CNAME, MX for target domains and subdomains. Flags/data often in TXT records of subdomains, not root domain.

---

## 5. Tor Relay Lookups

Identify Tor relay information from fingerprints:

```
https://metrics.torproject.org/rs.html#simple/<FINGERPRINT>
```

- Check family members (relays operated by same entity)
- Sort by "first seen" date for chronological ordering

**String identification:** 40 hex chars = SHA-1 (Tor fingerprint), 64 hex = SHA-256, 32 hex = MD5.

---

## 6. GitHub Repository Analysis

Hidden information often exists in GitHub repo comments, not just code:

```bash
# Issue comments
gh api repos/OWNER/REPO/issues/comments

# All commits
gh api repos/OWNER/REPO/commits

# PR review comments
gh api repos/OWNER/REPO/pulls/comments

# Wiki pages (if enabled)
# Clone wiki: git clone https://github.com/OWNER/REPO.wiki.git
```

Check: issue comments, PR reviews, commit messages, wiki edit history.

---

## 7. Telegram Bot Investigation

### Finding Bot References

```python
# Search browser history for Telegram URLs
import sqlite3
conn = sqlite3.connect("History")  # Edge/Chrome history DB
cur = conn.cursor()
cur.execute("SELECT url FROM urls WHERE url LIKE '%t.me/%'")
```

### Bot Interaction Workflow

1. Visit `https://t.me/<botname>` → Opens in Telegram
2. Start conversation with `/start`
3. Bot may require verification (CTF-style challenges)
4. Answers often require knowledge from forensic analysis

### Verification Question Patterns

- "Which user account did you use for X?" → Check browser history, login records
- "Which account was modified?" → Check Security.evtx Event 4781 (rename)
- "What file did you access?" → Check MRU, Recent files, Shellbags

Bot responses may reveal: attacker identity, credentials to secondary systems, direct flag components, links to hidden web services.

---

## 8. FEC Political Donation Research

Track organizational donors through FEC filings.

**Resources:**

- [FEC.gov](https://www.fec.gov/data/) — Committee receipts and expenditures
- 501(c)(4) organizations can donate to Super PACs without disclosing original funders

**Technique:** Look for largest organizational donors, then research org leadership (CEO/President).

---

## 9. WHOIS Deep Investigation

> **Moved to dedicated module:** See `techniques/whois-universal.md` for the full
> multi-TLD WHOIS cascade with support for all ccTLDs (.vn, .th, .sg, .kr, etc.),
> reverse WHOIS, historical WHOIS, and IP/ASN lookups — all free, no API keys.
>
> Covers: 4-layer fallback (whoisdomain → CLI whois → Whoxy API → web scrape),
> 27+ ccTLD server mappings, .vn deep dive, confidence ratings.

---

## 10. Wayback Machine CDX API

```bash
# Find all archived URLs for a site
curl "http://web.archive.org/cdx/search/cdx?url=example.com*&output=json&fl=timestamp,original,statuscode"

# Check Twitter profile archives
curl "http://web.archive.org/cdx/search/cdx?url=twitter.com/USERNAME*&output=json"

# Check t.co shortlinks
curl "http://web.archive.org/cdx/search/cdx?url=t.co/SHORTCODE&output=json"
```

---

## 11. Unicode Homoglyph Steganography

Visually-identical Unicode characters from different blocks encode binary data in text.

### Detection

- Text looks normal but character-by-character analysis reveals non-ASCII codepoints
- Characters from Cyrillic, Greek, Armenian, Mathematical Monospace blocks
- Each character encodes 1 bit: ASCII = 0, homoglyph = 1

### Common Homoglyph Pairs

| ASCII        | Homoglyph    | Unicode Block |
| ------------ | ------------ | ------------- |
| `a` (U+0061) | `а` (U+0430) | Cyrillic      |
| `o` (U+006F) | `о` (U+043E) | Cyrillic      |
| `e` (U+0065) | `е` (U+0435) | Cyrillic      |
| `s` (U+0073) | `ѕ` (U+0455) | Cyrillic DZE  |
| `p` (U+0070) | `р` (U+0440) | Cyrillic      |

### Decoding

```python
def decode_homoglyph_stego(text):
    bits = []
    for ch in text:
        if ch in ('\u2019',):  # Platform auto-inserted right single quote
            continue
        if ord(ch) < 128:
            bits.append(0)  # Standard ASCII
        else:
            bits.append(1)  # Unicode homoglyph = 1 bit

    flag = ''
    for i in range(0, len(bits) - 7, 8):
        byte_val = 0
        for j in range(8):
            byte_val = (byte_val << 1) | bits[i + j]
        flag += chr(byte_val)
    return flag
```

**Key lessons:** Platform auto-formatting (smart quotes) must be excluded from bit encoding. Check ALL replies/posts, not just main content.

---

## 12. Confidence Ratings

| Finding                        | Confidence | Notes                      |
| ------------------------------ | ---------- | -------------------------- |
| DNS TXT record data            | HIGH       | Authoritative DNS response |
| WHOIS registration data        | HIGH       | Registrar-verified         |
| Wayback Machine archive        | HIGH       | Timestamped snapshot       |
| GitHub commit/issue data       | HIGH       | Platform audit trail       |
| Tor relay fingerprint match    | HIGH       | Cryptographic identity     |
| FEC filing data                | HIGH       | Government records         |
| Homoglyph steganography decode | HIGH       | Mathematical decoding      |
| Reverse WHOIS correlation      | MEDIUM     | May be shared hosting      |

---

_Web & DNS Forensics Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
