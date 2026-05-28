# Template Index

Pre-built case workflows organized by domain. Run with `/case-template run [id]`.

---

## Available Templates

### Business

| ID                  | Name                  | Inputs        | Duration  | Output            |
| ------------------- | --------------------- | ------------- | --------- | ----------------- |
| `due-diligence`     | Company Due Diligence | Name, domain  | 15–25 min | Risk score 0–10   |
| `vendor-verify`     | Supplier Verification | Name, domain  | 10–15 min | Pass/Fail + flags |
| `executive-profile` | Leadership Research   | Name, company | 20–30 min | Profile + risk    |

### Individual

| ID                 | Name                    | Inputs         | Duration  | Output              |
| ------------------ | ----------------------- | -------------- | --------- | ------------------- |
| `background-check` | Subject Background      | Name, region   | 20–30 min | Verification report |
| `dating-verify`    | Online Connection Check | Name, platform | 15–20 min | Risk assessment     |
| `tenant-screen`    | Rental Applicant Review | Name, location | 15–25 min | Screening report    |

### Security

| ID                | Name                   | Inputs          | Duration  | Output              |
| ----------------- | ---------------------- | --------------- | --------- | ------------------- |
| `security-review` | Domain Security Review | Domain          | 10–20 min | Grade A–F + roadmap |
| `breach-check`    | Data Exposure Check    | Domain or email | 5–10 min  | Exposure summary    |
| `app-security`    | Application Analysis   | App name/domain | 15–20 min | Security findings   |

### Media & Content

| ID              | Name                     | Inputs         | Duration  | Output               |
| --------------- | ------------------------ | -------------- | --------- | -------------------- |
| `image-check`   | Image Authenticity Check | Image file/URL | 5–10 min  | Authenticity verdict |
| `source-verify` | News Source Assessment   | URL or name    | 8–12 min  | Credibility score    |
| `content-trace` | Content Origin Trace     | Text or image  | 10–15 min | Source attribution   |

---

## Commands

```
/case-template list                  — show this index
/case-template list --category [x]  — filter by category
/case-template info [id]             — show full template details
/case-template run [id]              — execute template
/case-template create                — build custom template
/case-template edit [id]             — modify custom template
/case-template export [id]           — save as YAML file
/case-template import [file]         — load YAML template
```

---

## Template Detail View

```
/case-template info due-diligence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company Due Diligence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7 phases — 15–25 min — Practitioner tier

Purpose:
  Evaluate company legitimacy, key personnel, legal standing,
  and reputation before partnerships or vendor engagement.

Requires:
  ✓ Company name
  ✓ Website domain
  ○ Region (optional — improves registry search)
  ○ Industry (optional)

Produces:
  • Risk score 0–10
  • Legal / compliance findings
  • Financial health indicators
  • Executive verification
  • Prioritized red flags

Phases:
  1. Entity registration check
  2. Online footprint mapping
  3. Key personnel verification
  4. Legal record sweep
  5. Reputation analysis
  6. Financial indicators
  7. Risk scoring and report

Run: /case-template run due-diligence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Execution States

| State      | Meaning                      |
| ---------- | ---------------------------- |
| INPUT      | Collecting required inputs   |
| VALIDATE   | Checking input completeness  |
| COLLECTION | Running research phases      |
| ANALYSIS   | Scoring and pattern matching |
| REPORT     | Generating output            |
| COMPLETE   | Results available            |

---

## Custom Template Builder

```
/case-template create

Name (kebab-case): _
Description: _

Defining Phase 1:
  Phase name: _
  Commands:
    1. _
    2. _

Add another phase? (yes / no)
```

### Variable Reference

| Variable              | Source      | Example        |
| --------------------- | ----------- | -------------- |
| `{{company_name}}`    | User input  | "Acme Corp"    |
| `{{domain}}`          | User input  | "acme.com"     |
| `{{location}}`        | User input  | "Germany"      |
| `{{date}}`            | System      | "2026-03-30"   |
| `{{phase1.emails}}`   | Prior phase | list of emails |
| `{{phase2.profiles}}` | Prior phase | profile URLs   |

### Template YAML Format

```yaml
id: quick-email-sweep
name: Quick Email Sweep
category: security
tier: practitioner
duration: 2–5 min
phases:
  - name: Domain sweep
    command: /sweep {{domain}}
  - name: Email discovery
    command: /dork "@{{domain}}" filetype:pdf OR filetype:doc
  - name: Compile
    command: /emails --format list
inputs:
  - name: domain
    type: domain
    required: true
```

---

## Context-Aware Suggestions

When a search implies a workflow, the system prompts:

```
You searched for a company name.
Run a full due diligence case?  /case-template run due-diligence
```

```
You uploaded an image.
Run an image authenticity check?  /case-template run image-check
```

---

## Pause and Resume

```
/case-template pause
  → Saves state at current phase
  → Resume: /case-template resume
  → View partial results: /results partial
```

---

## Related Files

- `experience/case-templates/tpl-due-diligence.md` — full due diligence spec
- `experience/case-templates/tpl-security-review.md` — full security review spec
- `experience/guided-flows/` — interactive step-by-step versions
