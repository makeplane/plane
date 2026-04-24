# Markdown Body Templates

Standard content structures for each markdown document type. See SKILL.md Rule 4 for overview.

## Universal Rules

- Start with `# Title` (H1) — one per file
- Frontmatter (`---`) for metadata when consumed by tools/automation
- Sections ordered: context → content → next steps
- Tables for structured data, lists for sequences
- Sacrifice grammar for concision
- List unresolved questions at end

## Plan (plan.md)

```markdown
---
title: "{Plan Title}"
status: pending | in_progress | completed | cancelled
created: YYYY-MM-DD
---

# {Plan Title}

## Overview
Brief description of what this plan accomplishes.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | {Phase name} | pending | [phase-01-{name}.md] |
| 2 | {Phase name} | pending | [phase-02-{name}.md] |

## Dependencies
- {dependency 1}
- {dependency 2}

## Success Criteria
- {criterion 1}
- {criterion 2}
```

## Phase (phase-{NN}-{name}.md)

```markdown
# Phase {NN}: {Name}

## Context Links
- Plan: [plan.md](./plan.md)
- Related: {links to reports, docs, code}

## Overview
- **Priority:** high | medium | low
- **Status:** pending | in_progress | completed
- **Description:** {brief description}

## Key Insights
- {finding from research}
- {critical consideration}

## Requirements
### Functional
- {requirement}
### Non-functional
- {requirement}

## Architecture
{system design, component interactions, data flow}

## Related Code Files
- **Modify:** {file paths}
- **Create:** {file paths}
- **Delete:** {file paths}

## Implementation Steps
1. {step with specific instructions}
2. {step}

## Todo
- [ ] {task}
- [ ] {task}

## Success Criteria
- {definition of done}

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|-----------|
| {risk} | {impact} | {mitigation} |

## Next Steps
- {dependency or follow-up}
```

## Report ({type}-report.md)

```markdown
---
type: {scout | researcher | code-reviewer | tester | debugger | brainstorm}
date: YYYY-MM-DD
---

# {Report Type}: {Subject}

## Summary
{2-3 sentence overview of findings}

## Findings
### {Finding 1}
{details, evidence, code references}

### {Finding 2}
{details}

## Recommendations
1. {actionable recommendation}
2. {recommendation}

## Unresolved Questions
- {question that needs further investigation}
```

## Journal (docs/journals/)

```markdown
---
date: YYYY-MM-DD
session: {session identifier or topic}
---

# Journal: {Date} — {Topic}

## Context
{what was being worked on, why}

## What Happened
- {key event/decision/discovery}
- {event}

## Reflection
{honest assessment — what went well, what didn't, emotional state}

## Decisions Made
| Decision | Rationale | Impact |
|----------|-----------|--------|
| {decision} | {why} | {what changes} |

## Next Steps
- {follow-up action}
```

## Doc (docs/*.md)

```markdown
# {Document Title}

## Overview
{brief description of what this document covers}

## {Section 1}
{content}

## {Section 2}
{content}

## References
- {link or reference}
```

No frontmatter needed for simple docs. Keep sections logical and scannable.

## ADR (docs/decisions/)

```markdown
# ADR-{NNN}: {Decision Title}

- **Status:** proposed | accepted | deprecated | superseded
- **Date:** YYYY-MM-DD
- **Deciders:** {who made this decision}

## Context
{what is the issue that motivates this decision}

## Decision
{what is the change being proposed/made}

## Consequences
### Positive
- {benefit}
### Negative
- {trade-off}

## Alternatives Considered
### {Alternative 1}
- **Pros:** {pros}
- **Cons:** {cons}
- **Why rejected:** {reason}
```

## Changelog

```markdown
# Changelog

## [{version}] - YYYY-MM-DD

### Added
- {new feature}

### Changed
- {modification to existing feature}

### Fixed
- {bug fix}

### Removed
- {removed feature}

### Deprecated
- {feature marked for future removal}
```

Follow [Keep a Changelog](https://keepachangelog.com) format.

## README

```markdown
# {Project Name}

{one-line description}

## Quick Start

{minimal steps to get running}

## Usage

{how to use the project}

## Development

{setup for contributors}

## Contributing

{contribution guidelines}

## License

{license info}
```

## Guide

```markdown
# {Guide Title}

## Prerequisites
- {requirement}

## Steps

### Step 1: {Name}
{instructions}

### Step 2: {Name}
{instructions}

## Troubleshooting

### {Common issue}
**Problem:** {description}
**Solution:** {fix}

## FAQ

### {Question}
{Answer}
```

## Spec / Requirements

```markdown
# {Spec Title}

## Overview
{what this spec defines}

## Requirements

### Functional
| ID | Requirement | Priority |
|----|------------|----------|
| F1 | {requirement} | must | should | could |

### Non-functional
| ID | Requirement | Metric |
|----|------------|--------|
| NF1 | {requirement} | {measurable target} |

## Constraints
- {constraint}

## API / Interface
{interface definitions, endpoints, schemas}

## Acceptance Criteria
- [ ] {criterion}
- [ ] {criterion}
```
