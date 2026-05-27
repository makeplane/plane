---
name: ck:cti-expert
description: "Analyze cyber threat intelligence and OSINT cases. Use for exposure reviews, domain recon, breach checks, username/email/phone research, image forensics, blockchain tracing, darknet checks, cloud tenant recon, vulnerability lookup, threat modeling, and structured reports."
user-invocable: true
when_to_use: "Invoke for OSINT, exposure review, or threat intelligence reports."
category: security
keywords: [osint, cti, threat-intelligence, recon, investigation, darknet, breach, forensics]
argument-hint: "[target] [--yolo] [--case|--sweep|--query|--flow]"
metadata:
  version: "2.0"
  author: "Hieu Ngo - chongluadao.vn"
  source: "https://github.com/7onez/cti-expert"
  license: "MIT"
---

# CTI Expert

Cyber threat intelligence and open-source intelligence skill. Turns Claude into a trained CTI/OSINT analyst. Generates precision search queries, interprets public data, builds case timelines, and delivers structured intelligence products — no API keys, no paid subscriptions.

Collection method: `agent-browser` when available (JavaScript-heavy sites, infinite-scroll, screenshot evidence without real user login state); use `ck:chrome-profile` only when the collection needs the user's actual Chrome cookies, with automatic fallback to web search / web fetch / direct URL fetch. Tool limitations are logged as collection gaps — never as case blockers.

---

## 1. Quick Start

```bash
# Full autonomous case — runs every applicable technique
/case target.com

# Guided flow for first-time investigators
/flow person

# Summary of what's been found so far
/brief
```

Append `--yolo` to any command to skip all interactive prompts and confirmations. The analyst makes every decision autonomously.

---

## 2. AEAD Case Lifecycle

Every investigation follows four phases:

| Phase       | What Happens                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Acquire** | Collect raw data — `/sweep`, `/query`, `/username`, `/phone`, `/email-deep`, `/subdomain`       |
| **Enrich**  | Expand leads — `/branch`, `/crossref`, `/link-subjects`, `/signatures`                          |
| **Assess**  | Score and verify — `/exposure`, `/threat-model`, `/validate`, `/coverage`, `/verify-finding`    |
| **Deliver** | Package output — `/report`, `/brief`, `/render`, `/workspace save` — **auto-saves .md + .docx** |

Run `/progress` at any point to see which phase you're in and what's pending.

---

## 3. Command Reference

Commands grouped by AEAD phase.

### Acquire

| Command                   | What It Does                                                     | Example                                                   |
| ------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `/case [target]`          | Full pipeline — runs every applicable technique                  | `/case example.com`                                       |
| `/sweep [target]`         | Multi-vector recon on any target type                            | `/sweep @username`                                        |
| `/query [subject]`        | Builds 12–15 advanced search operator queries                    | `/query example.com`                                      |
| `/username [handle]`      | Enumerate handle across 3000+ platforms                          | `/username johndoe`                                       |
| `/phone [number]`         | Carrier, line type, reputation, public associations              | `/phone +84901234567`                                     |
| `/email-deep [email]`     | Accounts, breach history, infrastructure                         | `/email-deep u@domain.com`                                |
| `/subdomain [domain]`     | CT logs, brute-force, passive enumeration                        | `/subdomain example.com`                                  |
| `/breach-deep [email]`    | Multi-source breach lookup with context                          | `/breach-deep u@domain.com`                               |
| `/traffic [domain]`       | Traffic estimation, ranking, audience data                       | `/traffic example.com`                                    |
| `/visitors [domain]`      | Full visitor intelligence: tech, geo, sources, analytics         | `/visitors example.com`                                   |
| `/techstack [domain]`     | Technology fingerprint (CMS, analytics, CDN, server)             | `/techstack example.com`                                  |
| `/competitors [domain]`   | Competitor & related site discovery                              | `/competitors example.com`                                |
| `/secrets [target]`       | Exposed credentials in repos and paste sites                     | `/secrets github.com/org`                                 |
| `/threat-check [target]`  | IP/domain/URL/hash threat intelligence                           | `/threat-check 185.1.1.1`                                 |
| `/scam-check [domain]`    | Phishing/scam/malicious domain check                             | `/scam-check susp-site.xyz`                               |
| `/vuln-check [query]`     | CVE/vulnerability lookup (CIRCL + NVD)                           | `/vuln-check CVE-2024-1234` or `/vuln-check apache/httpd` |
| `/ransomware-check [org]` | Check if org is a ransomware victim                              | `/ransomware-check "Acme Corp"`                           |
| `/gdoc [url]`             | Extract metadata/owner from Google document                      | `/gdoc https://docs.google.com/...`                       |
| `/msftrecon [domain]`     | M365/Azure tenant recon — tenant ID, federation, MDI, SharePoint | `/msftrecon example.com`                                  |
| `/sharelink [url]`        | Extract sharer identity from share link                          | `/sharelink https://vm.tiktok.com/ABC`                    |

<!-- dork-integration:phase-05 start -->

| `/dork-sweep [target] [--telegram\|--docs\|--filetype\|--all] [--after DATE] [--clean]` | Zero-auth dork sweep: Telegram ecosystem, 18 doc-hosts, filetype families; 4-tier fallback cascade | `/dork-sweep example.com --filetype` |
| `/docleak [target] [--platform list] [--severity high]` | 18-platform document leak hunt with severity classification (CRITICAL/HIGH/MEDIUM/LOW) | `/docleak "Acme Corp"` |

<!-- dork-integration:phase-05 end -->

| `/dns-history [domain]` | Historical DNS record changes (A, NS, MX) via passive DNS | `/dns-history example.com` |
| `/cert-history [domain]` | SSL/TLS certificate timeline from CT logs (crt.sh) | `/cert-history example.com` |
| `/email-permute [name] [domain]` | Generate email permutations from name + domain | `/email-permute "John Smith" company.com` |
| `/proton-check [email]` | Proton Mail account creation date via PGP key | `/proton-check user@proton.me` |
| `/pgp-lookup [email]` | PGP key search — creation date, UIDs, signatures | `/pgp-lookup dev@example.com` |
| `/wifi [ssid]` | WiFi SSID geolocation via Wigle.net | `/wifi "HomeNetwork"` |
| `/wifi --bssid [mac]` | Exact AP lookup by MAC address | `/wifi --bssid AA:BB:CC:DD:EE:FF` |
| `/register [name]` | Add a subject to the case workspace | `/register JohnDoe` |
| `/snapshots [url]` | View archived Wayback snapshots of a URL | `/snapshots example.com` |

### Enrich

| Command                  | What It Does                              | Example                    |
| ------------------------ | ----------------------------------------- | -------------------------- |
| `/branch [data]`         | Expand a discovered identifier laterally  | `/branch john@mail.com`    |
| `/timeline [subject]`    | Assemble dated event sequence             | `/timeline Company Inc`    |
| `/crossref`              | Detect shared identifiers across subjects | `/crossref`                |
| `/link-subjects [A] [B]` | Define a connection between two subjects  | `/link-subjects John Jane` |
| `/show-connections`      | Display all logged connections            | `/show-connections`        |
| `/show-trail [subject]`  | Show the evidence chain for a subject     | `/show-trail JohnDoe`      |
| `/watch [subject]`       | Add subject to active tracking list       | `/watch example.com`       |
| `/record-finding`        | Log a finding with source and confidence  | Paste data after command   |
| `/show-findings`         | List all recorded findings                | `/show-findings`           |
| `/graph`                 | Full ASCII subject relationship map       | `/graph`                   |
| `/pathfind [A] [B]`      | Discover connection path between subjects | `/pathfind A B`            |
| `/diff [url]`            | Diff archived versions of a URL           | `/diff example.com/page`   |

### Assess

| Command                   | What It Does                           | Example                    |
| ------------------------- | -------------------------------------- | -------------------------- |
| `/exposure [target]`      | Composite exposure score (0–100)       | `/exposure domain.com`     |
| `/threat-model`           | Build threat model from findings       | `/threat-model`            |
| `/signatures`             | Surface recurring behavioral patterns  | `/signatures`              |
| `/validate`               | Quality audit — score 0–100            | `/validate`                |
| `/coverage`               | Coverage matrix with identified gaps   | `/coverage`                |
| `/verify-finding [id]`    | Re-check a specific finding's sources  | `/verify-finding 12`       |
| `/subject [name]`         | View or create subject record          | `/subject JohnDoe`         |
| `/lookup [name]`          | Retrieve a registered subject          | `/lookup JohnDoe`          |
| `/modify [name]`          | Update a subject record                | `/modify JohnDoe`          |
| `/archive-subject [name]` | Remove subject from active tracking    | `/archive-subject JohnDoe` |
| `/find [query]`           | Search across all subjects             | `/find domain:example.com` |
| `/show-trail [subject]`   | Full evidence trail                    | `/show-trail JohnDoe`      |
| `/blind-spots`            | Prioritized investigation gap analysis | `/blind-spots`             |
| `/source-check`           | Batch source URL accessibility check   | `/source-check`            |
| `/drift [subject]`        | Temporal risk score tracking           | `/drift example.com`       |
| `/clarify [finding]`      | Plain-language finding explanation     | `/clarify fnd-003`         |

### Deliver

| Command                   | What It Does                             | Example                       |
| ------------------------- | ---------------------------------------- | ----------------------------- |
| `/report`                 | Formal structured intelligence report    | `/report`                     |
| `/report brief`           | Single-page executive brief              | `/report brief`               |
| `/report json`            | Raw data as JSON                         | `/report json`                |
| `/report csv`             | Spreadsheet-compatible export            | `/report csv`                 |
| `/report legal`           | Evidence-formatted for legal proceedings | `/report legal`               |
| `/report journalist`      | Source-citation-heavy format             | `/report journalist`          |
| `/brief`                  | Plain-language summary (non-technical)   | `/brief`                      |
| `/render entities`        | ASCII subject relationship diagram       | `/render entities`            |
| `/render timeline`        | Chronological event chart                | `/render timeline`            |
| `/render risk`            | Exposure heatmap                         | `/render risk`                |
| `/render network`         | Network topology of connections          | `/render network`             |
| `/stats`                  | Counts and coverage statistics           | `/stats`                      |
| `/workspace save [name]`  | Persist case state                       | `/workspace save mycase`      |
| `/workspace open [name]`  | Resume a saved case                      | `/workspace open mycase`      |
| `/workspace list`         | Show saved cases                         | `/workspace list`             |
| `/workspace diff [a] [b]` | Diff two saved workspaces                | `/workspace diff case1 case2` |
| `/render threat-path`     | ASCII attack path flow diagram           | `/render threat-path`         |
| `/render attack-surface`  | ASCII attack surface exposure map        | `/render attack-surface`      |
| `/report ioc`             | Export IOCs as STIX 2.1 or flat list     | `/report ioc --format stix`   |

### UX & Navigation

| Command                | What It Does                            | Example                        |
| ---------------------- | --------------------------------------- | ------------------------------ |
| `/flow [type]`         | Guided step-by-step case workflow       | `/flow person`                 |
| `/template list`       | Browse pre-built case templates         | `/template list`               |
| `/template run [name]` | Run a pre-built template                | `/template run security-audit` |
| `/novice`              | Toggle simplified, low-jargon mode      | `/novice`                      |
| `/terms`               | OSINT term glossary                     | `/terms`                       |
| `/progress`            | Current case phase and coverage         | `/progress`                    |
| `/opsec`               | OPSEC checklist for current task        | `/opsec`                       |
| `/onboard`             | Interactive first-time onboarding guide | `/onboard`                     |
| `/quality`             | Investigation quality composite score   | `/quality`                     |

---

## 4. Subject & Connection Model

Reference: `engine/case-schema.json`, `engine/subject-registry.md`

### Subject Types

| Type           | Emoji | Examples                        |
| -------------- | ----- | ------------------------------- |
| Person         | 👤    | Full name, alias                |
| Username       | @     | Social handle                   |
| Email          | 📧    | Address, domain                 |
| Domain         | 🌐    | Site, subdomain                 |
| IP Address     | 🖥    | IPv4, IPv6                      |
| Organization   | 🏢    | Company, group                  |
| Phone          | 📱    | E.164 format                    |
| Location       | 📍    | GPS, address                    |
| Asset          | 📦    | Document, image                 |
| Event          | 📅    | Dated occurrence                |
| Device         | 🖥️    | IoT device, server, workstation |
| Image          | 🖼️    | Photograph, screenshot          |
| Crypto Address | 💰    | Bitcoin, Ethereum wallet        |
| Custom         | 🏷️    | User-defined entity type        |

### Connection Types

```
owns         — domain, email, or asset ownership
uses         — platform account or tool usage
works_at     — employment or affiliation
linked_to    — general association
alias        — same identity, different handle
communicated_with — observed contact
```

### Finding Trust Scores

| Score | Label     | Meaning                             |
| ----- | --------- | ----------------------------------- |
| 5     | PRIMARY   | Authoritative or official source    |
| 4     | DERIVED   | Confirmed by 2+ independent sources |
| 3     | CONFIRMED | Single reliable source, verified    |
| 2     | ANECDOTAL | Reported but unverified             |
| 1     | CONTESTED | Conflicting data exists             |

### Source Reliability Scale

Complements numeric trust scores with source-level grading. Trust score rates finding content; source reliability rates the source itself.

| Grade | Label                | Typical Sources                          |
| ----- | -------------------- | ---------------------------------------- |
| A     | Completely Reliable  | Official registries, government records  |
| B     | Usually Reliable     | Established outlets, corporate sources   |
| C     | Fairly Reliable      | Known blogs, industry publications       |
| D     | Not Usually Reliable | Anonymous forums, unverified claims      |
| E     | Unreliable           | Known disinformation, fabricated content |
| F     | Cannot Be Judged     | Insufficient information to assess       |

### Confidence Levels

| Level      | Label                              | Use When |
| ---------- | ---------------------------------- | -------- |
| VERIFIED   | Direct observation, primary source |          |
| STRONG     | Multiple corroborating sources     |          |
| MODERATE   | Single reliable source             |          |
| WEAK       | Circumstantial or inferred         |          |
| TENTATIVE  | Analyst deduction only             |          |
| CHALLENGED | Contradicted by other findings     |          |

### Map Rendering (ASCII Mandatory)

**ALL visualization commands produce ASCII box-drawing art by default.** This includes `/graph`, `/render entities`, `/render network`, `/render timeline`, `/render risk`, `/pathfind`, and `/show-connections`. Mermaid available only with explicit `--mermaid` flag.

**Why ASCII-first:** Universal terminal compatibility, renders correctly in .md and .docx exports, no external renderer dependency.

```
┌─────────────────────────────┐   owns   ┌───────────────────────────┐
│ 👤 John Doe          [3/5] │══════════▶│ 🌐 example.com     [4/5] │
└─────────────────────────────┘           └───────────────────────────┘
         │ works_at                       │ hosted_on
         ▼                                ▼
┌─────────────────────────────┐  ┌───────────────────────────┐
│ 🏢 Acme Corp         [4/5] │  │ 🖥 203.0.113.10    [4/5] │
└─────────────────────────────┘  └───────────────────────────┘
```

**Connection arrows:** `═══▶` owns · `───▶` confirmed · `···▶` inferred · `←─▶` bidirectional · `─·─▶` alias · `╌╌▶` works_at
**Box styles:** `┌──┐` confirmed · `┌ ─ ┐` unverified · `╔══╗` target
**Badge:** `[n/5]` trust score · emoji prefix = entity type

---

## 5. Finding Framework

Reference: `engine/finding-framework.md`, `engine/conflict-resolver.md`

Every finding logged via `/record-finding` captures:

```
Source URL / method
Collection method (browser | search | fetch | manual)
Trust score (1–5)
Confidence level (VERIFIED → CHALLENGED)
Timestamp
Linked subjects
```

**Conflict detection** (`engine/conflict-resolver.md`): When two findings about the same subject contradict each other, the system flags a CONTESTED state. Both findings are preserved. Resolution options: accept one, mark both TENTATIVE, or log the conflict as its own finding.

**Deviation detection** (`analysis/deviation-detector.md`): Automatically flags behavioral anomalies — account creation gaps, platform presence inconsistencies, metadata mismatches.

**Weight engine** (`analysis/weight-engine.md`): Aggregates trust scores across findings to compute subject-level confidence.

---

## 6. Technique Catalog

Reference directory: `techniques/`

| File                          | Covers                                             |
| ----------------------------- | -------------------------------------------------- |
| `fx-metadata-parsing.md`      | EXIF, email headers, document metadata analysis    |
| `fx-image-verification.md`    | Image authenticity and provenance workflow         |
| `fx-breach-discovery.md`      | Breach database methods and paste site search      |
| `fx-geolocation.md`           | GPS extraction, W3W, Plus Codes, MGRS, Street View |
| `fx-social-topology.md`       | Social graph construction and topology             |
| `fx-email-header-analysis.md` | Header analysis, SPF/DKIM, SMTP routing            |
| `fx-document-forensics.md`    | Document forensics and metadata extraction         |
| `fx-http-fingerprint.md`      | HTTP fingerprinting and server signature analysis  |
| `fx-leak-monitoring.md`       | Leak and breach monitoring, paste site search      |

<!-- dork-integration:phase-05 start -->

| `fx-dork-sweep.md` | Zero-auth Google/Bing dork sweeps — Telegram ecosystem, doc-hosts, filetype families + 4-tier fallback cascade (WebSearch → Bing → DDG → agent-browser) |
| `fx-document-leak-hunt.md` | 18-platform document leak discovery with severity classification, paywall handling, auto-snapshot |

<!-- dork-integration:phase-05 end -->

| `username-osint.md` | 3000+ platform enumeration with pivot extraction |
| `phone-osint.md` | Carrier lookup, VoIP detection, spam databases, FreeCNAM CallerID, WhoCalld, USPhoneBook reverse lookup |
| `email-osint.md` | Full email investigation: accounts, breaches, infra, Proton API, PGP keys, permutation, manual reference tools |
| `fx-dns-cert-history.md` | Historical DNS records (passive DNS, A/NS/MX changes), SSL certificate timeline (crt.sh CT logs) |
| `threat-intel.md` | AbuseIPDB, GreyNoise, OTX, VirusTotal, **URLScan.io**, **CIRCL CVE**, **NVD API**, **ransomware.live** |
| `web-traffic-analysis.md` | SimilarWeb/Semrush estimation, audience data |
| `secret-scanning.md` | Credential/secret detection in repos and pastes |
| `domain-advanced.md` | Subfinder, Amass, CT log enumeration |
| `social-media-platforms.md` | Twitter/X Snowflake IDs, Discord, Strava, BlueSky, ShareTrace share link analysis |
| `advanced-geolocation-techniques.md` | Overpass Turbo, road sign analysis, reflected text |
| `web-dns-forensics.md` | Zone transfers, Tor lookups, GitHub, Telegram, WHOIS, Xeuledoc Google doc intel |
| `fx-visitor-intelligence.md` | Visitor stats, tech stack, geo, traffic sources, analytics/AdSense/advertising ID cross-domain linking, competitors |
| `wifi-ssid-osint.md` | WiFi SSID/BSSID geolocation via Wigle.net, encryption analysis, travel patterns |
| `scam-check.md` | Phishing/scam domain verification and detection |
| `cloud-audit.md` | Cloud infrastructure security (AWS/GCP/Azure): IAM, network, storage, compute, logging, secrets |
| `microsoft-tenant-recon.md` | M365/Azure tenant enumeration — federation, tenant ID, Azure AD config, MDI detection |
| `dependency-audit.md` | Supply chain security: CVE audit, framework-specific vulns, typosquatting, CI/CD security |
| `disk-forensics.md` | Digital evidence analysis: image integrity, Sleuth Kit, file carving, artifact recovery, timeline |
| `incident-triage.md` | Security incident response: NIST 800-61 methodology, containment, evidence preservation, IOC extraction |
| `owasp-audit.md` | OWASP Top 10 (2021) source code audit with grep patterns and CWE references |
| `prompt-injection-audit.md` | AI/LLM security: prompt injection classes, agent/MCP security, permission boundary audit |

---

## 7. Workflow Guides

Reference directory: `workflows/`

| Guide                          | Intended User                              | File                         |
| ------------------------------ | ------------------------------------------ | ---------------------------- |
| Journalist Source Verification | Journalists verifying claims               | `wf-journalist.md`           |
| HR Screening                   | HR professionals running background checks | `wf-hr-screening.md`         |
| Cyber Threat Intelligence      | Security analysts tracking adversaries     | `wf-threat-analyst.md`       |
| Private Investigator           | Licensed PIs running person cases          | `wf-private-investigator.md` |

Activate via `/flow [type]` — interactive guided prompts walk through each step.

---

## 8. Output Formats

Reference: `output/reports/`, `connectors/`

### Mandatory File Export (CRITICAL)

**Every `/report`, `/brief`, and `/case` command MUST auto-save two files to disk at the end of delivery:**

1. **Markdown report** — saved as `OSINT-REPORT-[CASE-ID]-[YYYY-MM-DD].md`
2. **Word document** — saved as `OSINT-REPORT-[CASE-ID]-[YYYY-MM-DD].docx`

**Save location:** Current working directory, or `./osint-reports/` subdirectory if it exists.

**DOCX generation (Rich format with charts & diagrams):**

**Step 1 — Build the DOCX-ready JSON file.** The Python generator expects a SPECIFIC flat format (NOT the engine case-schema.json). You MUST construct the JSON matching this exact structure before calling the script. Reference: `scripts/sample-cti-report-data.json`.

```json
{
  "case": {
    "id": "CTI-2026-001", // string, case identifier
    "label": "Case Title", // string, human-readable name
    "classification": "OPEN SOURCE", // string
    "analyst": "AI-Assisted CTI", // string
    "date": "2026-04-08", // ISO date
    "subject": "target.com", // string, primary subject
    "status": "active", // string
    "exposure_score": 72 // integer 0-100 (optional, enables risk gauge)
  },
  "executive_summary": "Full paragraph summarizing investigation findings...",
  "subjects": [
    {
      "id": "SUB-001", // string ID (not UUID)
      "label": "target.com", // human-readable name — REQUIRED for display
      "type": "domain", // lowercase: domain, person, ip, organization, email, username
      "confidence": 95, // INTEGER 0-100 (not string like "VERIFIED")
      "verified": true, // boolean
      "aliases": ["alias1"], // string array
      "first_seen": "2025-01-15", // ISO date string
      "notes": "Primary domain" // string
    }
  ],
  "findings": [
    {
      "id": "FND-001", // string ID
      "subject_id": "SUB-001", // links to subject
      "type": "infrastructure", // credential, infrastructure, identity, exposure, behavioral, legal
      "weight": "HIGH", // CRITICAL, HIGH, MEDIUM, LOW, INFO — drives severity colors
      "description": "Full description of the finding...",
      "source_url": "https://...",
      "collected_at": "2026-04-08T10:00:00Z",
      "confidence": 88, // INTEGER 0-100 (not string)
      "tags": ["tag1", "tag2"]
    }
  ],
  "connections": [
    {
      "id": "CON-001",
      "from_id": "SUB-001", // subject ID
      "to_id": "SUB-002", // subject ID
      "relationship": "owns", // string describing relationship
      "strength": "confirmed" // confirmed, probable, possible
    }
  ],
  "timeline": [{ "date": "2025-01-15", "event": "Domain registered" }],
  "sources": [{ "name": "Source Name", "url": "https://...", "date": "2026-04-08" }],
  "intelligence_gaps": ["Gap description string"],
  "recommendations": ["Action item string"],
  "visitor_stats": {
    // optional — enables visitor intelligence charts
    "domain": "target.com",
    "monthly_visits": 150000,
    "traffic_sources": { "direct": 42, "search": 28, "referral": 15, "social": 10, "paid": 5 },
    "top_countries": [
      { "country": "Vietnam", "share": 60 },
      { "country": "US", "share": 20 }
    ]
  },
  "caveats": ["Caveat string"] // optional — overrides default methodology notes
}
```

**CRITICAL FORMAT RULES:**

- `confidence` on subjects and findings MUST be an **integer** (e.g., `85`), NOT a string (e.g., `"VERIFIED"`)
- `findings` MUST be a **flat top-level array**, NOT nested inside subjects
- `label` is REQUIRED on each subject (this is what displays in the report — not `value` or `display_name`)
- `weight` on findings drives severity coloring — use CRITICAL/HIGH/MEDIUM/LOW/INFO
- `recommendations` must be an array of **strings** (not objects with `priority`/`action` keys)
- All fields shown above should be **populated with actual data** — empty strings or "N/A" defeat the purpose
- Populate `executive_summary` with a full paragraph — this is the most-read section of the report

**Step 2 — Save the JSON and run the generator:**

```bash
# Primary: HYBRID generator — full narrative from MD + charts/diagrams from JSON
# This produces a complete DOCX with ZERO content loss from the MD report
python3 ~/.claude/skills/cti-expert/scripts/generate-cti-docx-hybrid.py \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].md" \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].json" \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].docx"

# Fallback 1: JSON-only generator (charts + structured data, less narrative)
python3 ~/.claude/skills/cti-expert/scripts/generate-cti-docx.py \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].json" \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].docx"

# Fallback 2: MD-only mode (styled narrative, no charts — JSON optional)
python3 ~/.claude/skills/cti-expert/scripts/generate-cti-docx-hybrid.py \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].md" \
  "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].docx"

# Fallback 3: pandoc (basic text conversion, no styling or charts)
pandoc "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].md" \
  -o "CTI-REPORT-[CASE-ID]-[YYYY-MM-DD].docx" \
  --from markdown --to docx --standalone
```

**How the hybrid generator works:**

1. **Phase 1:** pandoc converts the MD file to a base DOCX (preserving ALL narrative content — tables, lists, formatting)
2. **Phase 2:** python-docx post-processes to add CTI professional styling, prepend cover page + TOC, and inject charts/diagrams from JSON at matching section headings

**The MD file is the primary content source.** It carries the full narrative (detailed person profiles, infrastructure tables, wallet addresses, corporate structure, legal history, etc.). The JSON file provides structured data for visual elements (charts, diagrams, risk gauge). Using both together produces a complete report with zero content loss.

**Rich hybrid DOCX includes:** Cover page titled "CTI REPORT", table of contents, **all narrative content from MD** (every paragraph, table, list, code block), pie chart (finding types), bar chart (severity), risk gauge (exposure score), timeline chart, entity relationship diagram, network topology diagram, traffic/geo charts, CTI-themed styling (navy headings, styled tables), header/footer with classification and page numbers.

**After saving, confirm all files to the user:**

```
📄 Report saved:
   → CTI-REPORT-CASE001-2026-03-30.md
   → CTI-REPORT-CASE001-2026-03-30.json
   → CTI-REPORT-CASE001-2026-03-30.docx  (rich format with charts & diagrams)
```

### Report Formats

| Format                 | Command              | Audience                    |
| ---------------------- | -------------------- | --------------------------- |
| Technical INTSUM       | `/report`            | Analysts, security teams    |
| Executive Brief        | `/report brief`      | Decision-makers, management |
| Plain-Language Summary | `/brief`             | Non-technical stakeholders  |
| Legal Evidence Format  | `/report legal`      | Attorneys, compliance teams |
| Journalist Format      | `/report journalist` | Reporters, media            |
| JSON Export            | `/report json`       | Downstream tools, pipelines |
| CSV Export             | `/report csv`        | Spreadsheets, databases     |

All formats above auto-save as .md + .docx unless the format is inherently machine-only (JSON, CSV — those save as their native format only).

### Visual Outputs

| Type                     | Command            | Format                                        |
| ------------------------ | ------------------ | --------------------------------------------- |
| Subject relationship map | `/render entities` | **ASCII** (default) — `--mermaid` for Mermaid |
| Chronological timeline   | `/render timeline` | **ASCII** Gantt                               |
| Exposure heatmap         | `/render risk`     | **ASCII**                                     |
| Network topology         | `/render network`  | **ASCII**                                     |

**All visual outputs use ASCII box-drawing by default.** Mermaid only on explicit `--mermaid` flag.

### Connectors

| Tool     | File                           | What It Exports       |
| -------- | ------------------------------ | --------------------- |
| Maltego  | `connectors/maltego-export.md` | GraphML entity graph  |
| Obsidian | `connectors/obsidian-setup.md` | Linked markdown notes |
| Notion   | `connectors/notion-schema.md`  | Structured database   |

---

## 9. Skill Tiers & Customization

Reference: `experience/skill-tiers.md`, `experience/layered-detail.md`

### Tiers

| Tier             | Command       | What Changes                                          |
| ---------------- | ------------- | ----------------------------------------------------- |
| **Novice**       | `/novice`     | Jargon removed, steps explained, glossary auto-linked |
| **Practitioner** | (default)     | Standard output, moderate detail                      |
| **Specialist**   | `/novice off` | Full technical detail, raw findings, internal signals |

Switch tiers at any point — output adapts immediately.

### Guided Flows

`experience/guided-flows/` contains step-by-step interactive flows:

- `person-investigation.md` — Full guided person case
- `domain-reconnaissance.md` — Guided domain sweep
- `email-investigation.md` — Guided email tracing
- `rapid-case.md` — 10-minute abbreviated sweep

Activate: `/flow person` · `/flow domain` · `/flow email` · `/flow quick`

### Case Templates

`experience/case-templates/` contains pre-built starting configurations:

- `due-diligence.md` — Corporate partner vetting
- `security-audit.md` — Organization exposure audit
- `background-check.md` — Individual background research

Activate: `/template run [name]`

---

## 10. Ethics & Boundaries

This skill operates strictly within publicly available information.

### Permitted

- Journalists verifying facts about public figures or institutions
- Security professionals auditing their own organization's exposure
- Individuals reviewing their own digital footprint
- Corporate due diligence on business partners
- Academic research and educational demonstrations

### Prohibited

- Stalking, harassment, or doxing of any individual
- Accessing accounts or systems without authorization
- Social engineering or deception campaigns
- Any activity violating applicable law

Ethical reminders are issued automatically when the investigation approaches sensitive territory. Public data is not a license to cause harm.

---

## 11. Autonomous Mode (--yolo)

Append `--yolo` to any command or activate at session start.

**What changes:**

- No clarifying questions — analyst infers context and proceeds
- No confirmation prompts — scope expands automatically on new discoveries
- Guided flows skip Q&A — reasonable defaults applied
- Both `/report` and `/brief` generated without asking

**What stays the same:**

- Ethics and legal boundaries — always enforced
- Trust scores on every finding
- Source citations on every claim
- `/validate` and `/coverage` run before final delivery

Activate per-command: `/case target.com --yolo`
Activate for session: `/cti-expert --yolo`

---

## 12. Architecture Reference

```
cti-expert/
├── SKILL.md                    This file
├── README.md                   User-facing overview
│
├── engine/                     Case data model and state management
│   ├── case-schema.json        Subject and finding data structures
│   ├── subject-registry.md     How subjects are tracked and versioned
│   ├── finding-framework.md    Finding lifecycle, trust scores, evidence chains
│   ├── workspace-format.md     Workspace serialization spec
│   ├── workspace-manager.md    Save/open/list workspace logic
│   └── conflict-resolver.md    CONTESTED finding resolution
│
├── analysis/                   Pattern detection and intelligence engines
│   ├── deviation-detector.md   Behavioral anomaly detection
│   ├── auto-branch-rules.md    Automatic pivot trigger rules
│   ├── drift-monitor.md        Subject state change tracking
│   ├── cross-reference-engine.md Shared identifier detection across subjects
│   ├── archive-explorer.md     Wayback Machine integration and diff
│   ├── signature-catalog.md    Behavioral pattern library
│   ├── exposure-model.md       Exposure score calculation framework
│   ├── risk-trend-tracker.md   Temporal risk score tracking (/drift)
│   ├── pattern-library.md      Username, email, bot detection patterns
│   └── weight-engine.md        Finding aggregation and confidence weighting
│
├── techniques/                 Collection techniques and module specs
│   ├── fx-metadata-parsing.md  EXIF, headers, document metadata
│   ├── fx-image-verification.md Image authenticity and provenance
│   ├── fx-breach-discovery.md  Breach database and paste site methods
│   ├── fx-geolocation.md       GPS, W3W, Plus Codes, Street View
│   ├── fx-social-topology.md   Social graph construction and topology
│   ├── fx-email-header-analysis.md Header analysis, SPF/DKIM
│   ├── fx-document-forensics.md Document forensics and extraction
│   ├── fx-http-fingerprint.md  HTTP fingerprinting and signatures
│   ├── fx-leak-monitoring.md   Leak and breach monitoring
│   ├── username-osint.md       Platform enumeration (3000+)
│   ├── phone-osint.md          Phone carrier/VoIP/spam lookup
│   ├── email-osint.md          Deep email investigation
│   ├── threat-intel.md         Threat intelligence free lookups
│   ├── web-traffic-analysis.md Traffic estimation methods
│   ├── secret-scanning.md      Credential/secret detection
│   ├── domain-advanced.md      Subdomain enumeration methods
│   ├── social-media-platforms.md Platform-specific techniques
│   ├── advanced-geolocation-techniques.md Overpass Turbo, road signs, reflected text
│   ├── wifi-ssid-osint.md      WiFi SSID/BSSID geolocation via Wigle.net
│   ├── web-dns-forensics.md    DNS, GitHub, Telegram, WHOIS
│   ├── fx-visitor-intelligence.md Visitor stats, tech stack, geo analysis
│   ├── scam-check.md           Phishing/scam domain verification
│   ├── cloud-audit.md          Cloud infrastructure security audit
│   ├── microsoft-tenant-recon.md M365/Azure tenant enumeration
│   ├── dependency-audit.md     Supply chain security audit
│   ├── disk-forensics.md       Digital evidence analysis
│   ├── incident-triage.md      Security incident response
│   ├── owasp-audit.md          OWASP Top 10 source code audit
│   ├── prompt-injection-audit.md AI/LLM security audit
│   └── ioc-export.md           IOC export (STIX 2.1, flat list)
│
├── experience/                 UX, tiers, and guided flows
│   ├── skill-tiers.md          Novice/Practitioner/Specialist spec
│   ├── layered-detail.md       Progressive disclosure rules
│   ├── guidance-system.md      How guided flows work
│   ├── case-progress.md        Progress tracking logic
│   ├── guided-flows/           Interactive step-by-step flows
│   │   ├── flow-person-lookup.md Person investigation guided flow
│   │   ├── flow-domain-sweep.md Domain reconnaissance guided flow
│   │   └── flow-image-check.md Image verification guided flow
│   ├── case-templates/         Pre-built case configurations
│   │   ├── tpl-index.md        Template index and descriptions
│   │   ├── tpl-due-diligence.md Due diligence case template
│   │   ├── tpl-security-review.md Security audit case template
│   │   └── tpl-background-check.md Background check case template
│   ├── tutorial.md             First-time onboarding guide (/onboard)
│   ├── feedback-system.md      Investigation quality feedback loops
│   └── accessibility/          Glossary and accessibility settings
│       ├── glossary.md         OSINT term glossary
│       └── accessible-mode.md  Low-jargon mode settings
│
├── output/                     Report and visualization specs
│   ├── reports/                Report format templates
│   │   ├── format-catalog.md   Report format specifications
│   │   ├── leadership-brief-template.md Executive brief template
│   │   ├── export-specs.md     Export format specifications
│   │   └── citation-guide.md   Source citation standards
│   └── visuals/                Chart and visualization specs
│       ├── chart-templates.md  Chart rendering templates
│       ├── ui-components.md    UI component library
│       ├── render-engine.md    ASCII render engine spec
│       ├── case-dashboard.md   Dashboard layout spec
│       ├── attack-path-diagram.md  Attack path flow visualization (/render threat-path)
│       └── attack-surface-map.md   Attack surface exposure map (/render attack-surface)
│
├── scripts/                    DOCX report generation
│   ├── generate-cti-docx-hybrid.py  PRIMARY: Hybrid MD+JSON generator (pandoc + post-process)
│   ├── generate-cti-docx.py         Fallback: JSON-only generator
│   ├── cti_docx_postprocess.py      Post-processing: styling, chart injection, cover page
│   ├── cti_docx_charts.py           Chart rendering (pie, bar, gauge, timeline, traffic, geo)
│   ├── cti_docx_diagrams.py         Entity relationship + network topology diagrams
│   ├── cti_docx_sections.py         Report section formatting (used by JSON-only generator)
│   ├── cti_docx_styles.py           Document styling, colors, cover page, header/footer
│   ├── requirements.txt             Python dependencies
│   └── sample-cti-report-data.json  Example JSON report data
│
├── workflows/                  Professional workflow guides
│   ├── wf-journalist.md
│   ├── wf-hr-screening.md
│   ├── wf-threat-analyst.md
│   └── wf-private-investigator.md
│
├── handbook/                   Reference material
│   ├── operator-queries.md     Search operator catalog
│   ├── quick-report.md         Rapid reporting reference
│   ├── discovery-paths.md      Per-target-type search paths
│   ├── report-template.md      INTSUM format specification
│   └── tool-cascade-reference.md Tool priority and fallback chains
│
├── guides/                     Worked case walkthroughs
│   └── walkthroughs/           Step-by-step investigation examples
│       ├── walkthrough-person-lookup.md
│       ├── walkthrough-domain-sweep.md
│       └── walkthrough-username-trace.md
│
├── validation/                 Quality assurance
│   ├── coverage-matrix.md      Investigation area coverage tracking
│   ├── quality-scoring.md      Scoring methodology
│   └── verification-checklist.md Finding verification steps
│
└── connectors/                 External tool integrations
    ├── maltego-export.md
    ├── obsidian-setup.md
    └── notion-schema.md
```

---

## Technique Activation Matrix

Which techniques activate per target type in a `/case` run:

| Technique                               | Person | Domain | Org  | Username | Email | IP  |
| --------------------------------------- | ------ | ------ | ---- | -------- | ----- | --- |
| `/sweep`                                | ✅     | ✅     | ✅   | ✅       | ✅    | ✅  |
| `/query`                                | ✅     | ✅     | ✅   | ✅       | ✅    | ✅  |
| `/username`                             | ✅     | —      | ✅\* | ✅       | —     | —   |
| `/email-deep`                           | ✅     | —      | ✅\* | —        | ✅    | —   |
| `/phone`                                | ✅     | —      | ✅\* | —        | —     | —   |
| `/breach-deep` (LeakCheck + HudsonRock) | ✅     | ✅     | ✅   | ✅       | ✅    | ✅  |
| `/subdomain`                            | —      | ✅     | ✅   | —        | —     | —   |
| `/traffic`                              | —      | ✅     | ✅   | —        | —     | —   |
| `/threat-check`                         | —      | ✅     | ✅   | —        | —     | ✅  |
| `/secrets`                              | —      | ✅     | ✅   | ✅       | —     | —   |
| `/scam-check`                           | —      | ✅     | ✅   | —        | —     | —   |
| `/branch`                               | ✅     | ✅     | ✅   | ✅       | ✅    | ✅  |
| `/gdoc`                                 | —      | ✅     | ✅   | —        | —     | —   |
| `/sharelink`                            | ✅     | —      | ✅   | ✅       | ✅    | —   |

<!-- dork-integration:phase-05 start -->

| `/dork-sweep` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* |
| `/docleak` | ✅ | ✅ | ✅ | ✅* | — | — |

<!-- dork-integration:phase-05 end -->

| Social media platforms | ✅ | — | ✅ | ✅ | — | — |
| Metadata forensics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Photo verification | ✅ | — | ✅* | ✅ | — | — |
| Network analysis | — | ✅ | ✅ | — | — | ✅ |
| Advanced geolocation | ✅ | — | — | ✅ | — | — |
| Web & DNS forensics | — | ✅ | ✅ | — | ✅ | ✅ |
| `/timeline` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/exposure` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/threat-model` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/wifi` (SSID/BSSID) | ✅ | ✅ | ✅ | — | — | ✅ |
| Visitor intelligence | — | ✅ | ✅ | — | — | ✅ |
| Cloud audit | — | ✅ | ✅ | — | — | ✅ |
| MSFTRecon (M365/Azure tenant) | — | ✅ | ✅ | — | — | — |
| Dependency audit | — | ✅ | ✅ | — | — | — |
| Disk forensics | — | — | — | — | — | — |
| Incident triage | — | ✅ | ✅ | — | — | ✅ |
| OWASP audit | — | ✅ | ✅ | — | — | — |
| Prompt injection audit | — | ✅ | ✅ | — | — | — |
| `/snapshots` | — | ✅ | ✅ | — | — | ✅ |
| `/diff` | — | ✅ | ✅ | — | — | ✅ |
| `/drift` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/render threat-path` | — | ✅ | ✅ | — | — | ✅ |
| `/render attack-surface` | — | ✅ | ✅ | — | — | ✅ |
| `/blind-spots` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/source-check` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/report ioc` | — | ✅ | ✅ | — | — | ✅ |
| `/report` + `/brief` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shodan InternetDB (ports/tags/vulns) | — | ✅ | ✅ | — | — | ✅ |
| GreyNoise Community (noise/threat class) | — | ✅ | ✅ | — | — | ✅ |
| URLScan.io passive (scan history) | — | ✅ | ✅ | — | — | — |
| Disposable email check (kickbox) | ✅ | — | ✅* | — | ✅ | — |
| URLhaus (malware URL hosting) | — | ✅ | ✅ | — | — | ✅ |
| ThreatFox (IOC/C2 lookup) | — | ✅ | ✅ | — | — | ✅ |
| MalwareBazaar (hash → malware family) | — | — | — | — | — | — |
| ipwho.is (geo + ASN + ISP) | — | ✅ | ✅ | — | — | ✅ |
| DMARC/SPF/DKIM check (DNS) | — | ✅ | ✅ | — | ✅ | — |

`✅*` — runs for discovered key personnel within the organization
`MalwareBazaar` — activates only via `/hash [value]` when a file hash is discovered during investigation

**Adaptive chaining:** Each phase feeds newly discovered identifiers into subsequent phases automatically. If `/sweep` on a domain finds an email, `/email-deep` and `/breach-deep` trigger on it automatically.

<!-- dork-integration:phase-05 start -->

**`✅*` dork coverage notes:** `/dork-sweep` on IP runs against reverse-DNS hostname once resolved (graceful skip if no rDNS); `/docleak` on Username targets document-author/uploader fields on scribd, slideshare, academia.edu, researchgate.

**Dork auto-fire matrix — every `/case` target type gains coverage:**

- Person → `/dork-sweep --telegram --docs` + `/docleak` on full name
- Domain → `/dork-sweep --filetype --docs` + `/docleak` on domain + org name
- Org → `/dork-sweep --filetype --docs --telegram` + `/docleak` on org + primary domain
- Username → `/dork-sweep --telegram --docs` + `/docleak` (author-angle)
- Email → `/dork-sweep --telegram --docs` on email + `@domain`
- IP → `/dork-sweep` on rDNS-resolved hostname (skipped if no rDNS)

Adaptive fan-out: discovered emails → Telegram dork; discovered personnel → `/docleak`; discovered subdomains → filetype dork; discovered usernames → Telegram + doc sweep; discovered IPs → rDNS → dork-sweep.

<!-- dork-integration:phase-05 end -->

When `/case` or `/sweep` runs on a Domain or Org target, it inspects the MX record and SPF TXT record. If MX ends in `protection.outlook.com` OR SPF contains `spf.protection.outlook.com`, `/msftrecon` auto-fires as part of the Acquire phase. Results feed back into the subject registry as `infrastructure` findings (tenant ID, federation type, MDI presence) and into `/exposure` scoring.

**`/case` pipeline walkthrough (M365-hosted Domain/Org):** (a) standard DNS/WHOIS/subdomain/traffic/scam-check/breach-deep checks run first, (b) if M365 indicators present → `/msftrecon` fires automatically with no extra flag, (c) tenant ID discovered becomes a pivot for `/branch` in Enrich phase (search other domains under the same tenant). No user intervention required.

**Parallel enrichment (3+ subjects):** When Acquire discovers 3+ subjects, enrichment commands fan out in parallel via AgentFlow DAG orchestration. Each subject's enrichment runs independently, results merge with dedup before Assess phase. Disable with `--sequential` flag. See `techniques/agentflow-enrichment.md`.

---

## Exposure Score Bands

| Range  | Label    | Action                        |
| ------ | -------- | ----------------------------- |
| 0–25   | Minimal  | Passive monitoring sufficient |
| 26–50  | Moderate | Periodic review advised       |
| 51–75  | Elevated | Address within 30 days        |
| 76–100 | Critical | Immediate escalation required |

---

## Tool Priority & Fallback

1. Check `agent-browser` availability first; use `ck:chrome-profile` only if real user Chrome cookies are required
2. Use `agent-browser` for generic screenshot evidence and interactive UI; use `ck:chrome-profile` only when real Chrome profile state is required
3. Use Scrapling DynamicFetcher for: JS-heavy sites, SPA content, auto-escalation from static
4. Use Scrapling StealthyFetcher for: anti-bot bypass, Cloudflare-protected targets
5. Use Scrapling Fetcher for: fast static page collection, HTML parsing (~2ms)
6. Fall back to web search → web fetch → direct curl — no investigation blockers
7. Tag each finding with collection method: `[browser]` · `[scrapling-dynamic]` · `[scrapling-stealth]` · `[scrapling-static]` · `[search]` · `[fetch]` · `[manual]` · `[whois-lib]` · `[whois-cli]` · `[whois-api]`

---

## Tool Auto-Install Policy

**Before running any CLI tool, check if it exists on the system. If not, install it automatically and silently.** This ensures zero-friction investigation — the analyst never stalls on missing dependencies.

### Auto-Install Protocol

1. **Check:** `command -v <tool> >/dev/null 2>&1` (or `python -m <module> --help` for Python modules)
2. **Install:** If missing, run the install command from the table below
3. **Verify:** Confirm installation succeeded before proceeding
4. **Log:** Note `[auto-installed]` in the finding's collection method tag
5. **Continue:** Proceed with the investigation — never block on tool availability

### Install Commands by Tool

| Tool             | Check Command                                                            | Install Command                                                                                          |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Maigret          | `command -v maigret`                                                     | `pip3 install maigret`                                                                                   |
| Sherlock         | `command -v sherlock`                                                    | `pipx install sherlock-project`                                                                          |
| Blackbird        | `command -v blackbird`                                                   | `pip3 install blackbird-osint`                                                                           |
| PhoneInfoga      | `command -v phoneinfoga`                                                 | `go install github.com/sundowndev/phoneinfoga/v2/cmd/phoneinfoga@latest`                                 |
| Holehe           | `command -v holehe`                                                      | `pip3 install holehe`                                                                                    |
| h8mail           | `command -v h8mail`                                                      | `pip3 install h8mail`                                                                                    |
| theHarvester     | `command -v theHarvester`                                                | `pip3 install theHarvester`                                                                              |
| TruffleHog       | `command -v trufflehog`                                                  | `pip3 install trufflehog`                                                                                |
| Gitleaks         | `command -v gitleaks`                                                    | `go install github.com/gitleaks/gitleaks@latest`                                                         |
| Subfinder        | `command -v subfinder`                                                   | `go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest`                               |
| Amass            | `command -v amass`                                                       | `go install github.com/owasp-amass/amass/v4/...@master`                                                  |
| GAU              | `command -v gau`                                                         | `go install github.com/lc/gau/v2/cmd/gau@latest`                                                         |
| Xeuledoc         | `command -v xeuledoc`                                                    | `pip3 install xeuledoc`                                                                                  |
| MSFTRecon        | `command -v msftrecon`                                                   | `pip3 install git+https://github.com/Arcanum-Sec/msftrecon.git`                                          |
| ShareTrace       | `python -m sharetrace --help 2>/dev/null`                                | `git clone https://github.com/7onez/sharetrace.git && cd sharetrace && pip3 install -r requirements.txt` |
| exiftool         | `command -v exiftool`                                                    | `apt install -y libimage-exiftool-perl`                                                                  |
| pdfinfo          | `command -v pdfinfo`                                                     | `apt install -y poppler-utils`                                                                           |
| oletools         | `python -c "import oletools" 2>/dev/null`                                | `pip3 install oletools`                                                                                  |
| qpdf             | `command -v qpdf`                                                        | `apt install -y qpdf`                                                                                    |
| mat2             | `command -v mat2`                                                        | `apt install -y mat2`                                                                                    |
| whois            | `command -v whois`                                                       | `apt install -y whois`                                                                                   |
| dig              | `command -v dig`                                                         | `apt install -y dnsutils`                                                                                |
| jq               | `command -v jq`                                                          | `apt install -y jq`                                                                                      |
| ASN              | `command -v asn`                                                         | `bash <(curl -sL https://raw.githubusercontent.com/nitefood/asn/master/asn)`                             |
| Waymore          | `command -v waymore`                                                     | `pip3 install waymore`                                                                                   |
| Pandoc           | `command -v pandoc`                                                      | `apt install -y pandoc`                                                                                  |
| whoisdomain      | `python -c "import whoisdomain" 2>/dev/null`                             | `pip3 install whoisdomain`                                                                               |
| Scrapling        | `python -c "import scrapling" 2>/dev/null`                               | `pip3 install scrapling`                                                                                 |
| Scrapling (full) | `python -c "from scrapling.fetchers import StealthyFetcher" 2>/dev/null` | `pip3 install "scrapling[fetchers]" && scrapling install`                                                |
| AgentFlow        | `python -c "import agentflow" 2>/dev/null`                               | `pip3 install agentflow-py`                                                                              |

### Behavior Rules

- **Silent install:** Do not ask permission — install and proceed. Tool installation is a normal part of the investigation workflow.
- **pip vs pipx:** Use `pip` by default. Use `pipx` only for tools that explicitly require it (Sherlock).
- **Go tools:** Require Go installed. If `command -v go` fails, note the gap and fall back to next tool in cascade.
- **apt tools:** May require root. Use `sudo apt install -y` if not running as root.
- **Git-based install:** For tools without PyPI packages (ShareTrace), clone the repo and install dependencies via `git clone ... && cd ... && pip3 install -r requirements.txt`
- **Fallback on install failure:** If installation fails, skip to the next tool in the cascade — never block the investigation.
