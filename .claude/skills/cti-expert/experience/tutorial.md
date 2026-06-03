# Tutorial — /onboard Command

Guided introduction to the CTI Expert skill. Adapts depth to tier.

---

## Command

```
/onboard [--tier novice|practitioner|specialist]
```

- `--tier` overrides auto-detected tier for this session only
- `--yolo` skips onboarding entirely and opens an empty case
- Omitting `--tier` uses the tier stored in `workspace_metadata.tier`

---

## Auto-Trigger

Suggested automatically when tier auto-detects as `novice` and
`workspace_metadata.onboarding_completed` is absent. Prompt:

```
First session detected. Run /onboard to start, or /onboard --yolo to skip.
```

---

## Tier Adaptation Table

| Step | Topic                          | Novice       | Practitioner | Specialist   |
| ---- | ------------------------------ | ------------ | ------------ | ------------ |
| 1    | What is OSINT?                 | Full verbose | Skip         | Skip         |
| 2    | Start a case demo              | Full verbose | Concise      | Concise      |
| 3    | Read results — trust scores    | Full verbose | Concise      | Concise      |
| 4    | Dig deeper — /branch /crossref | Full verbose | Concise      | Full verbose |
| 5    | Report — /brief /report        | Full verbose | Concise      | Full verbose |

---

## Step 1 — What Is OSINT?

_Novice only. Practitioners and Specialists skip to Step 2._

```
OSINT (Open-Source Intelligence) means gathering information from
publicly available sources — no hacking, no deception, no private
databases. Everything collected comes from:

  • Public websites and social media
  • Government and court records
  • Domain registration data (WHOIS)
  • Breach disclosure databases
  • News archives and academic sources

Why it matters: Organizations use OSINT to vet partners, investigate
fraud, track threat actors, and surface risks before they escalate.

Legal note: OSINT is legal when sources are public. This skill
never advises accessing private systems or deceiving subjects.

[ Press Enter to continue ]
```

---

## Step 2 — Start a Case Demo

**Novice (verbose):**

```
Let's open a demo case to see how investigations work.

  /case new --name "Tutorial Demo" --subject "example.com"

This creates a fresh workspace with one subject: a domain.
Subjects are the people, organizations, or infrastructure you
are investigating. You can add more with /subject add.

[ Press Enter to run the demo case ]
```

**Practitioner / Specialist (concise):**

```
Demo case: /case new --name "Tutorial Demo" --subject "example.com"
Add subjects later with /subject add. Starting now.
```

---

## Step 3 — Read Results — Trust Scores

**Novice (verbose):**

```
After a scan you will see findings like this:

  [F-001] Domain registered: 2018-03-12
          Source: WHOIS (whois.verisign-grs.com)
          Trust: ●●●●○  4/5  — Reliable registry data

Trust scores run from 1 (unverified) to 5 (authoritative).
  ●○○○○  1  Unverified — single unconfirmed source
  ●●○○○  2  Low — needs corroboration
  ●●●○○  3  Moderate — credible but not confirmed
  ●●●●○  4  High — multiple consistent sources
  ●●●●●  5  Authoritative — primary or official record

Use /clarify F-001 to get a plain-language explanation of any finding.
```

**Practitioner / Specialist (concise):**

```
Trust scores: 1=unverified → 5=authoritative. Use /clarify [id]
to decompose any finding. Scores ≤ 2 flag for /verify-finding.
```

---

## Step 4 — Dig Deeper — /branch and /crossref

**Novice (verbose):**

```
Findings often unlock new leads. Two key commands:

  /branch F-001
    Follow a finding outward. The domain registration date in F-001
    might reveal a registrar account — which could link to other domains.

  /crossref F-001 F-002
    Compare two findings for shared attributes (same email, same IP,
    same registrar). Connections surface patterns that a single
    finding cannot show alone.

When findings conflict, use /resolve to document the discrepancy
rather than silently dropping one.
```

**Practitioner (concise):**

```
/branch [id] — follow a finding outward.
/crossref [id] [id] — compare findings for shared attributes.
/resolve — document conflicting findings.
```

_Specialist: full verbose (same as Novice)._

---

## Step 5 — Report — /brief and /report

**Novice / Specialist (verbose):**

```
When your investigation is ready for delivery:

  /brief
    A 1-page executive summary. Written in plain language.
    Includes: subject summary, key findings, confidence overview,
    recommended actions.

  /report [--format pdf|md|html]
    Full structured report. Includes all findings, source citations,
    coverage matrix, and limitations section.

Always run /validate before generating a report.
Tip: /coverage shows which discovery paths you have not yet tried.
```

**Practitioner (concise):**

```
/brief — executive summary. /report [--format] — full report.
Run /validate first. /coverage shows unchecked paths.
```

---

## Completion Tracking and --yolo

On completion, write to `workspace_metadata`:

```json
{
  "onboarding_completed": true,
  "onboarding_tier": "novice",
  "onboarding_timestamp": "<ISO-8601>"
}
```

Subsequent sessions skip the auto-trigger prompt.

`/onboard --yolo` skips all steps immediately and writes
`{ "onboarding_completed": true, "onboarding_skipped": true }`.

---

## Related Files

- `experience/skill-tiers.md` — tier definitions and auto-detection
- `experience/feedback-system.md` — quality feedback after investigation
- `engine/workspace-manager.md` — workspace_metadata schema
