# Username OSINT Module

> **Module ID:** USR-OSINT-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Cross-Platform Username Enumeration & Profile Correlation

---

## 1. Overview

Username OSINT discovers accounts across platforms using a single handle. Use when a target's username or alias is known and cross-platform presence needs mapping. Combines automated scanning with manual verification to build a digital footprint.

**Key use cases:** Alias tracking, platform correlation, activity timeline reconstruction, alt-account discovery.

---

## 2. Tool Inventory

### Primary — Maigret (3000+ sites)

```bash
pip3 install maigret
# or
pipx install maigret
```

### Secondary — Sherlock (400+ sites)

```bash
pipx install sherlock-project
# or
pip3 install sherlock-project
```

### Tertiary — Blackbird (600+ sites, async)

```bash
pip3 install blackbird-osint
```

### Web Fallback — WhatsMyName

- URL: https://whatsmyname.app
- Repo: https://github.com/WebBreacher/WhatsMyName
- No install required; browser-based or API-accessible

---

## 3. Investigation Workflow

```
Step 1: Normalize target username
  └─ Strip spaces, special chars; note common variants (underscores, dots, numbers)

Step 2: Run Maigret (widest coverage)
  └─ Use --top-sites 500 for speed vs. --all-sites for coverage

Step 3: Run Sherlock in parallel (different site list)
  └─ Cross-references sites Maigret may miss

Step 4: Run Blackbird for social-focused sites
  └─ Better at newer platforms (TikTok, Clubhouse, etc.)

Step 5: Manual spot-check top hits
  └─ Confirm profile photo, bio, posting style matches target

Step 6: Document and correlate findings
  └─ Map to real identity, email, location data
```

---

## 4. CLI Commands & Expected Output

### Maigret

```bash
# Top 500 sites, JSON output
maigret <username> --top-sites 500 --json maigret_results.json

# All sites (slower, ~3000)
maigret <username> --all-sites --folderoutput ./results/

# With proxy (Tor)
maigret <username> --top-sites 500 --tor
```

**Expected output:**

```
[+] Checking username "johndoe" on 500 sites
[+] Twitter: https://twitter.com/johndoe
[+] GitHub: https://github.com/johndoe
[-] Facebook: Not found
[*] Reddit: Claimed (unverified)
...
[*] Found 47 accounts. Report saved: johndoe.json
```

### Sherlock

```bash
# Standard scan with JSON output
sherlock <username> --output sherlock_results.txt --print-found

# Multiple usernames
sherlock user1 user2 user3 --print-found

# Skip NSFW sites
sherlock <username> --nsfw
```

**Expected output:**

```
[*] Checking username "johndoe" on: Twitter
[+] Twitter: https://twitter.com/johndoe
[+] Instagram: https://www.instagram.com/johndoe/
[*] GitHub: https://www.github.com/johndoe
```

### Blackbird

```bash
# Basic scan
blackbird -u <username>

# Export JSON
blackbird -u <username> --json

# Email-based search
blackbird -e user@example.com
```

---

## 5. Fallback Cascade

```
Maigret unavailable?
  └─> Use Sherlock (pip3 install sherlock-project)

Sherlock unavailable?
  └─> Use WhatsMyName web UI at whatsmyname.app

No CLI tools?
  └─> Manual Google dorking:
        inurl:<username> site:twitter.com
        inurl:<username> site:instagram.com
        "<username>" profile -site:google.com

API rate-limited?
  └─> Add --timeout 10 --retries 2 flags
  └─> Use --tor for Maigret to rotate exit nodes
```

---

## 6. Output Interpretation

### Claim Status Meanings

```
[+] Found/Claimed   → Account confirmed active with content
[*] Available       → Username not taken on that platform
[-] Not Found       → No account OR profile is private/deleted
[!] Error           → Timeout, captcha, or platform change
```

### False Positive Handling

```
Common false positives:
  - 404 pages that still return HTTP 200
  - Deleted accounts with cached profile URLs
  - Username squatting (empty accounts)

Verification steps:
  1. Open URL manually — check for profile photo, bio, posts
  2. Confirm content matches target's known interests/language
  3. Check join date vs. known target activity timeline
  4. Cross-match profile photo via reverse image search (TinEye/Google)
  5. Look for cross-links (e.g., Instagram bio linking to known Twitter)
```

### Cross-Platform Correlation

```
Strong correlation signals:
  - Same profile photo across platforms
  - Same bio text / phrasing
  - Matching post timestamps (activity overlap)
  - Cross-posted content or reposts
  - Same follower/following relationships
  - Geotags in same locations
```

---

## 7. Confidence Ratings

| Finding Type                          | Confidence | Verification Method       |
| ------------------------------------- | ---------- | ------------------------- |
| Username found on major platform      | HIGH       | Manual profile review     |
| Username found on niche site          | MEDIUM     | Cross-check photo/bio     |
| Maigret-only result (no manual check) | LOW        | Always verify manually    |
| Cross-platform photo match            | HIGH       | Reverse image search      |
| Same bio text match                   | HIGH       | Direct comparison         |
| Activity timeline overlap             | MEDIUM     | Timezone/language check   |
| Deleted/suspended account evidence    | MEDIUM     | Archive.org, cached pages |

---

## 8. Limitations

1. **Private accounts** — Many platforms hide content; existence detectable but not content
2. **Username recycling** — Platforms reassign inactive usernames; old hits may be wrong person
3. **Rate limiting** — Aggressive scanning triggers CAPTCHAs or IP bans; use delays
4. **Site list drift** — Maigret/Sherlock site databases go stale as platforms change APIs
5. **Common usernames** — "johndoe", "admin", "user123" produce massive false positive noise
6. **Regional platforms** — VK, Weibo, Naver poorly covered by Western tools; check manually
7. **Tor dependency** — --tor flag requires Tor service running locally (`systemctl start tor`)

---

## 9. Command Reference

| Command                       | Purpose                           | Input           |
| ----------------------------- | --------------------------------- | --------------- |
| `/username [handle]`          | Full cross-platform username scan | Username string |
| `/username-variants [handle]` | Generate and scan common variants | Base username   |
| `/username-report [handle]`   | Compile correlation report        | Username string |

---

_Username OSINT Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized investigation and educational purposes only_
