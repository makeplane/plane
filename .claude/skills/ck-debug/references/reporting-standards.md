# Reporting Standards

Structured format for diagnostic and investigation reports. Sacrifice grammar for concision.

## When to Use

- After completing system investigation
- Summarizing debugging session findings
- Producing incident post-mortems
- Reporting performance analysis results

## Report Structure

### 1. Executive Summary (3-5 lines)

- **Issue:** One-line description
- **Impact:** Users/systems affected, severity
- **Root cause:** One-line explanation
- **Status:** Resolved / Mitigated / Under investigation
- **Fix:** What was done or recommended

### 2. Technical Analysis

**Timeline:**
```
HH:MM - Event description
HH:MM - Next event
...
```

**Evidence:**
- Relevant log excerpts (trimmed to essential lines)
- Query results with key metrics
- Error messages and stack traces
- Before/after comparisons

**Findings:**
- List each finding with supporting evidence
- Distinguish confirmed facts from hypotheses
- Note correlation vs causation

### 3. Actionable Recommendations

**Immediate (P0):**
- [ ] Critical fix with implementation steps

**Short-term (P1):**
- [ ] Follow-up improvements

**Long-term (P2):**
- [ ] Monitoring/alerting enhancements
- [ ] Architecture improvements
- [ ] Preventive measures

Each recommendation: what to do, why, expected impact, effort estimate (low/medium/high).

### 4. Supporting Evidence

- Relevant log excerpts
- Query results and execution plans
- Performance metrics
- Test results and error traces
- Screenshots or diagrams if applicable

### 5. Unresolved Questions

List anything that remains unclear:
- Items needing further investigation
- Questions for the team
- Assumptions that need validation

## Report File Naming

Use naming pattern from `## Naming` section injected by hooks. Pattern includes full path and computed date.

**Example:** `plans/reports/debugger-260205-2215-api-500-investigation.md`

## Writing Guidelines

- **Concise:** Facts and evidence, not narrative. Sacrifice grammar for brevity
- **Evidence-backed:** Every claim supported by logs, metrics, or reproduction steps
- **Actionable:** Recommendations are specific with clear next steps
- **Honest:** State unknowns explicitly. "Likely cause" vs "confirmed cause"
- **Structured:** Use headers, tables, and bullet points for scanability

## Template

```markdown
# [Issue Title] - Investigation Report

## Executive Summary
- **Issue:**
- **Impact:**
- **Root cause:**
- **Status:**
- **Fix:**

## Timeline
- HH:MM -
- HH:MM -

## Technical Analysis
### Findings
1.
2.

### Evidence
[logs, queries, metrics]

## Recommendations
### Immediate (P0)
- [ ]

### Short-term (P1)
- [ ]

### Long-term (P2)
- [ ]

## Unresolved Questions
-
```
