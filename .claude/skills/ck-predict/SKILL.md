---
name: ck:predict
description: "5 expert personas debate proposed changes before implementation. Catches architectural, security, performance, and UX issues early. Use before major features or risky changes."
argument-hint: "<feature description or change proposal> [--files <glob>]"
metadata:
  author: claudekit
  attribution: "Multi-persona prediction pattern adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "1.0.0"
---

# ck:predict — Multi-Persona Pre-Analysis

Five expert personas independently analyze a proposed change, then debate conflicts to produce a consensus verdict before a single line of code is written.

## When to Use

- Before implementing a major or high-risk feature
- Before a significant refactor or architecture change
- Evaluating competing technical approaches
- Stress-testing assumptions in a proposed design

## When NOT to Use

- Trivial or low-risk changes (use `ck:debug` for bugs, `ck:plan` for already-decided tasks)
- Already-approved work with no open design questions
- Pure dependency upgrades with no API changes

---

## The 5 Personas

| Persona | Focus | Core Questions |
|---------|-------|----------------|
| **Architect** | System design, scalability, coupling | Does this fit the architecture? Will it scale? What new coupling does it introduce? |
| **Security** | Attack surface, data protection, auth | What can be abused? Where is data exposed? Are auth boundaries respected? |
| **Performance** | Latency, memory, queries, bundle size | What is the latency impact? N+1 queries? Memory leaks? Bundle bloat? |
| **UX** | User experience, accessibility, error states | Is this intuitive? What does the error state look like? Accessible on mobile? |
| **Devil's Advocate** | Hidden assumptions, simpler alternatives | Why not do nothing? What is the simplest alternative? Which assumption could be wrong? |

---

## Debate Protocol

1. **Read** the proposed change/feature description from the argument
2. **Read relevant code** if file paths are provided (grep for affected areas)
3. **Each persona analyzes independently** — do not let personas influence each other during this phase
4. **Identify agreements** — points where all (or 4+) personas align
5. **Identify conflicts** — points where personas meaningfully disagree
6. **Weigh tradeoffs** — for each conflict, evaluate which concern has higher impact
7. **Produce verdict** — GO / CAUTION / STOP with actionable recommendations

---

## Output Format

```
## Prediction Report: [proposal title]

## Verdict: GO | CAUTION | STOP

### Agreements (all personas align)
- [Point 1 — what they all agree on]
- [Point 2]

### Conflicts & Resolutions

| Topic | Architect | Security | Performance | UX | Devil's Advocate | Resolution |
|-------|-----------|----------|-------------|-----|-----------------|------------|
| [Issue] | [View] | [View] | [View] | [View] | [View] | [Recommendation] |

### Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| [Risk description] | Critical/High/Medium/Low | [Concrete action] |

### Recommendations
1. [Action item — rationale]
2. [Action item — rationale]
3. [Action item — rationale]
```

---

## Verdict Levels

| Verdict | Meaning |
|---------|---------|
| **GO** | All personas aligned, no critical risks, proceed with confidence |
| **CAUTION** | Concerns exist but are manageable — mitigations identified, proceed carefully |
| **STOP** | Critical unresolved issue found — needs redesign or more information before proceeding |

### STOP Triggers (any one is sufficient)
- Security persona identifies auth bypass or data exposure with no viable mitigation
- Architect identifies fundamental design incompatibility requiring significant rework
- Performance persona identifies unacceptable latency or query explosion with no workaround
- Devil's Advocate exposes a false assumption that invalidates the entire approach

---

## Integration with Other Skills

| Workflow Step | Skill | How |
|---------------|-------|-----|
| Deepen risk scenarios | `ck:scenario` | Feed Risk Summary rows as feature description |
| Create implementation plan | `ck:plan` | Attach Recommendations as constraints to planner |
| High-risk feature implementation | `ck:cook` | Reference CAUTION/STOP items as acceptance gates |

---

## Example Invocations

```
/ck:predict "Add WebSocket support for real-time notifications"
/ck:predict "Migrate authentication from JWT to session cookies"
/ck:predict "Add multi-tenancy to the database layer"
/ck:predict "Replace REST API with GraphQL" --files src/api/**/*.ts
```
