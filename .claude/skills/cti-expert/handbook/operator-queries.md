# Operator Queries

Search engine operator patterns for open-source discovery. Organized by subject type.

---

## Operator Reference

| Operator    | Function              | Example                          |
| ----------- | --------------------- | -------------------------------- |
| `"phrase"`  | Exact match           | `"jane smith" "acme corp"`       |
| `site:`     | Restrict to domain    | `site:github.com`                |
| `filetype:` | File extension filter | `filetype:pdf`                   |
| `inurl:`    | Text in URL           | `inurl:admin`                    |
| `intitle:`  | Text in page title    | `intitle:"index of"`             |
| `intext:`   | Text in body          | `intext:password`                |
| `-`         | Exclude term          | `-site:pinterest.com`            |
| `OR`        | Either term           | `site:x.com OR site:twitter.com` |
| `*`         | Wildcard              | `"john * smith"`                 |
| `after:`    | Published after date  | `after:2025-01-01`               |
| `before:`   | Published before date | `before:2024-06-01`              |
| `cache:`    | Cached version        | `cache:example.com`              |

Combine 2–4 operators per query. More operators = higher precision, fewer results.

---

## Domain / Infrastructure Queries

**Exposed files:**

```
site:TARGET filetype:pdf
site:TARGET filetype:env OR filetype:log OR filetype:sql
site:TARGET filetype:xlsx OR filetype:csv
site:TARGET intitle:"index of /" "parent directory"
```

<!-- dork-integration:phase-03 start -->

**Target-domain filetype mega-dork (document sweep):**

```
site:DOMAIN (filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xls OR filetype:xlsx OR filetype:ppt OR filetype:pptx OR filetype:txt OR filetype:csv OR filetype:xml)
```

**Filetype risk library (group and dispatch by risk category):**

| Risk          | Extensions                        | Typical Find                              |
| ------------- | --------------------------------- | ----------------------------------------- |
| Credentials   | `env log sql bak conf properties` | `.env` secrets, DB dumps, SSH/API tokens  |
| Data exposure | `xls xlsx csv json xml`           | Customer lists, finance, backend exports  |
| Documents     | `pdf doc docx ppt pptx txt`       | Corp decks, memos, contracts, whitepapers |
| Code / infra  | `git swp sh ps1 yaml yml`         | Leaked repos, WIP scripts, IaC configs    |
| Logs          | `log txt out err`                 | Error stacks leaking paths, tokens, PII   |

OPSEC: active credential-hunting dorks are aggressive — use only with authorization.

See detailed technique: [`../techniques/fx-dork-sweep.md`](../techniques/fx-dork-sweep.md).

<!-- dork-integration:phase-03 end -->

**Admin panels:**

```
site:TARGET inurl:admin OR inurl:dashboard OR inurl:cpanel
site:TARGET inurl:login OR inurl:signin OR inurl:wp-admin
```

**API and dev artifacts:**

```
site:TARGET inurl:api OR inurl:graphql OR inurl:swagger
site:TARGET inurl:staging OR inurl:dev OR inurl:test
site:TARGET filetype:yaml OR filetype:yml
```

**Third-party references:**

```
"TARGET-DOMAIN" site:github.com
"TARGET-DOMAIN" site:pastebin.com
"TARGET-DOMAIN" site:trello.com OR site:notion.so
```

---

## Person / Identity Queries

**Core identity sweep:**

```
"Full Name"
"Full Name" site:linkedin.com
"Full Name" + "City" OR "Employer"
"Full Name" filetype:pdf
```

**Contact discovery:**

```
"firstname.lastname" "@domain.com"
"first last" "phone" OR "mobile" OR "contact"
"Full Name" inurl:contact OR inurl:about
```

**Professional presence:**

```
"Full Name" site:scholar.google.com
"Full Name" site:researchgate.net
"Full Name" patent
"Full Name" site:sec.gov
```

---

## Credential / Exposure Queries

**Leaked data indicators:**

```
"@target-domain.com" site:pastebin.com
"@target-domain.com" site:ghostbin.com
"target-domain.com" "password" OR "passwd"
"target-domain.com" "API key" OR "api_key" OR "secret"
```

**Code repository exposure:**

```
site:github.com "target-domain.com" "password"
site:github.com "target-domain.com" extension:env
site:github.com "target-domain.com" "BEGIN RSA PRIVATE KEY"
```

---

## Legal and Financial Queries

**Court and regulatory:**

```
"Full Name" site:courtlistener.com
"Company Name" site:sec.gov 10-K OR 10-Q
"Company Name" site:pacer.gov
"Full Name" OR "Company Name" "judgment" OR "lawsuit"
```

**Property and business:**

```
"Full Name" "property" site:[state-assessor-domain]
"Company Name" site:opencorporates.com
"Company Name" "annual report" filetype:pdf
```

---

## Social Media Queries

**Profile discovery:**

```
"username" site:x.com OR site:twitter.com
"username" site:reddit.com
"username" site:instagram.com
"username" site:github.com
"Full Name" site:facebook.com
```

**Content sweep:**

```
"username" OR "Full Name" inurl:posts OR inurl:status
"handle" "city" OR "location"
"handle" after:2024-01-01
```

**Noise reduction** — strip common false-positive domains:

```
"Full Name" -site:pinterest.com -site:yellowpages.com -site:whitepages.com -site:spokeo.com
```

---

## Cross-Platform Mega-Dorks

Single queries hitting multiple platforms at once. Replace `TARGET` with name, username, email, domain, or phone number.

**All major social media (single query):**

```
"TARGET" (site:facebook.com OR site:x.com OR site:twitter.com OR site:instagram.com OR site:youtube.com OR site:tiktok.com OR site:linkedin.com OR site:reddit.com OR site:threads.net)
```

**Telegram ecosystem (all Telegram-related domains):**

```
"TARGET" (site:t.me OR site:telegram.org OR site:telegram.me OR site:tgstat.com OR site:telemetr.io OR site:telemetryapp.io OR site:tgstat.ru OR site:telemetr.me OR site:telegra.ph OR site:storebot.me OR site:tlgrm.eu OR site:telegramchannels.me OR site:telegram-group.com)
```

<!-- dork-integration:phase-03 start -->

**Document-hosting platforms (corp/personal doc leaks — 18 sites):**

```
"TARGET" (site:scribd.com OR site:docplayer.net OR site:slideshare.net OR site:issuu.com OR site:academia.edu OR site:coursehero.com OR site:studocu.com OR site:researchgate.net OR site:medium.com OR site:pdfcoffee.com OR site:pdfcookie.com OR site:vdocuments.net OR site:123dok.com OR site:dokumen.tips OR site:idoc.pub OR site:fliphtml5.com OR site:anyflip.com OR site:calameo.com)
```

Severity classification + platform profiles: [`../techniques/fx-document-leak-hunt.md`](../techniques/fx-document-leak-hunt.md).

<!-- dork-integration:phase-03 end -->

**Developer/code platforms:**

```
"TARGET" (site:github.com OR site:gitlab.com OR site:bitbucket.org OR site:stackoverflow.com OR site:npmjs.com OR site:pypi.org OR site:hub.docker.com OR site:codeberg.org)
```

**Forums and communities:**

```
"TARGET" (site:reddit.com OR site:quora.com OR site:stackexchange.com OR site:medium.com OR site:substack.com OR site:hackernews.com OR site:news.ycombinator.com OR site:discord.com)
```

**Paste sites and dumps:**

```
"TARGET" (site:pastebin.com OR site:ghostbin.com OR site:paste.org OR site:dpaste.com OR site:hastebin.com OR site:justpaste.it OR site:rentry.co OR site:privatebin.net OR site:controlc.com OR site:paste.ee OR site:0bin.net OR site:gist.github.com)
```

<!-- dork-integration:phase-03 start -->

**Code-leak keyword patterns (per-platform):**

```
"TARGET" site:github.com (filename:.env OR filename:credentials.json OR "AWS_SECRET_ACCESS_KEY" OR "BEGIN RSA PRIVATE KEY" OR "JWT_SECRET")
"TARGET" site:gitlab.com ("password" OR "api_key" OR "BEGIN PRIVATE KEY")
"TARGET" (site:bitbucket.org OR site:codeberg.org) ("secret" OR "token")
```

<!-- dork-integration:phase-03 end -->

**Darknet-adjacent and leak sites:**

```
"TARGET" (site:ddosecrets.com OR site:wikileaks.org OR site:cryptome.org OR site:ransomwatch.telemetry.ltd OR site:ransomware.live)
```

**Breach and credential databases:**

```
"TARGET" (site:haveibeenpwned.com OR site:dehashed.com OR site:leakcheck.io OR site:breachdirectory.org OR site:intelx.io)
```

**Business and corporate intel:**

```
"TARGET" (site:opencorporates.com OR site:crunchbase.com OR site:dnb.com OR site:glassdoor.com OR site:bbb.org OR site:sec.gov OR site:courtlistener.com)
```

**Image and visual search:**

```
"TARGET" (site:flickr.com OR site:500px.com OR site:deviantart.com OR site:imgur.com OR site:unsplash.com OR site:pinterest.com)
```

**Messaging and chat platforms:**

```
"TARGET" (site:discord.com OR site:slack.com OR site:keybase.io OR site:matrix.org OR site:signal.group OR site:whatsapp.com)
```

**Job and recruitment (identity pivot):**

```
"TARGET" (site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:angel.co OR site:wellfound.com OR site:hired.com)
```

### Usage Tips

- Replace `TARGET` with any identifier: `"john.doe"`, `"john@example.com"`, `"+1234567890"`, `"example.com"`
- Add `after:YYYY-MM-DD` to time-bound results
- Add `-site:unwanted.com` to exclude noisy domains
- Google limits `OR` chains to ~32 terms — split into multiple queries if needed
- For organization investigations, combine: `"Company Name" OR "company.com" (site:...)`
- Wrap multi-word targets in quotes: `"Jane Smith"` not `Jane Smith`

## <!-- dork-integration:phase-03 start -->

## Noise Reduction

Append to any dork to strip common SEO/aggregator noise:

```
-site:pinterest.com -site:reddit.com -site:twitter.com -site:yellowpages.com -site:whitepages.com -site:spokeo.com
-inurl:cache -inurl:webcache -inurl:translate
```

---

## Time-Bounded Dorks

Narrow to a specific publication window to surface recent leaks or archived state.

- **Google:** `after:YYYY-MM-DD before:YYYY-MM-DD` (works best on filetype dorks; inconsistent on site: chains)
- **Bing:** append `&from=YYYYMMDD&to=YYYYMMDD` to the search URL
- **Recent-only shortcut (Google):** `when:1d` (last day), `when:1w`, `when:1m`, `when:1y`

Example — dump hunt in last 90 days:

```
"TARGET" (site:pastebin.com OR site:ghostbin.com) after:2026-01-19
```

<!-- dork-integration:phase-03 end -->

## <!-- dork-integration:phase-06 start -->

## Archived & Time-Travel Dorks

Find content removed from live web; surface historical state.

- Wayback direct: `https://web.archive.org/web/*/example.com/*`
- Wayback via search: `site:web.archive.org "example.com"`
- archive.org advancedsearch JSON (no auth, no rate-limit published):
  `https://archive.org/advancedsearch.php?output=json&q=collection:web+AND+domain:example.com`
- Related: `/snapshots` command. Technique: [`../techniques/fx-dns-cert-history.md`](../techniques/fx-dns-cert-history.md).

---

## Certificate Transparency Dorks

Enumerate subdomains + historical certs from CT logs.

- crt.sh wildcard JSON: `https://crt.sh/?q=%25.example.com&output=json`
- crt.sh exact: `https://crt.sh/?q=example.com`
- Censys dork: `"example.com" site:censys.io`
- Related: `/cert-history`. Technique: [`../techniques/fx-dns-cert-history.md`](../techniques/fx-dns-cert-history.md).

---

## Common Crawl URL Index (Power-User)

Raw crawl index; useful when Google/Bing dropped content.

- API index: `https://index.commoncrawl.org/CC-MAIN-2025-XX-index?url=example.com&output=json`
- Rotate crawl IDs (commoncrawl.org/the-data) for time-range coverage.
- Zero auth, no published rate limit.

---

## GitHub Code Search (Unauthenticated)

Public repos searchable without login (~60 req/hr unauth cap).

- URL: `https://github.com/search?q={ENCODED_QUERY}&type=code`
- Credential dorks: `"example.com" filename:.env`, `"example.com" "AWS_SECRET_ACCESS_KEY"`, `"example.com" "BEGIN RSA PRIVATE KEY"`
- Org-scoped: `org:example "password"`, `org:example filename:credentials.json`
- Related: `/secrets` command + [`../techniques/secret-scanning.md`](../techniques/secret-scanning.md).

---

## Academic & Patent Dorks

Surface leaked internal research, patents, and academic corp-docs.

- Scholar: `https://scholar.google.com/scholar?q="example.com"+internal`
- Books: `https://books.google.com/books?q="example.com"+confidential`
- Patents: `https://patents.google.com/?q="example.com"+OR+"AcmeCorp"`
- Combined: `"example.com" (site:patents.google.com OR site:scholar.google.com)`
<!-- dork-integration:phase-06 end -->

---

_See also: [`handbook/quick-report.md`](./quick-report.md), [`../techniques/fx-dork-sweep.md`](../techniques/fx-dork-sweep.md), [`../techniques/fx-document-leak-hunt.md`](../techniques/fx-document-leak-hunt.md)_
