# Red Team Personas

## Available Lenses

| Reviewer                      | Lens             | Focus                                                                                                            |
| ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Security Adversary**        | Attacker mindset | Auth bypass, injection, data exposure, privilege escalation, supply chain, OWASP top 10                          |
| **Failure Mode Analyst**      | Murphy's Law     | Race conditions, data loss, cascading failures, recovery gaps, deployment risks, rollback holes                  |
| **Assumption Destroyer**      | Skeptic          | Unstated dependencies, false "will work" claims, missing error paths, scale assumptions, integration assumptions |
| **Scope & Complexity Critic** | YAGNI enforcer   | Over-engineering, premature abstraction, unnecessary complexity, missing MVP cuts, scope creep, gold plating     |

## Verification Role Assignment

Each reviewer carries their adversarial lens PLUS a verification role. Findings must include grep/glob evidence from the actual codebase, not just logical argument.
Load: `references/verification-roles.md` for full role definitions.

**Tier precedence rule:** The verification tier (Light/Standard/Full) determines which verification roles are active — NOT the reviewer's persona assignment. At Light tier, all reviewers use Fact Checker regardless of persona. At Standard tier, Fact Checker + Contract Verifier. At Full tier, the persona-specific role below applies.

| Reviewer                  | Adversarial Lens | Verification Role (Full Tier) |
| ------------------------- | ---------------- | ----------------------------- |
| Security Adversary        | Attacker mindset | Fact Checker                  |
| Failure Mode Analyst      | Murphy's Law     | Flow Tracer                   |
| Assumption Destroyer      | Skeptic          | Scope Auditor                 |
| Scope & Complexity Critic | YAGNI enforcer   | Contract Verifier             |

### Evidence Requirement

- Every finding MUST include verification evidence from the codebase
- Run grep/glob to back up claims — cite file:line for every referenced symbol
- If claiming "X doesn't handle Y", show the actual code path proving it
- **Findings without codebase evidence = automatically rejected during adjudication**

## Reviewer Prompt Template

Each reviewer prompt MUST include:

1. This override: `"IGNORE your default code quality checks (linting, type safety, build validation). You are reviewing a PLAN DOCUMENT, not code — do not lint, build, or test. DO run grep/glob to verify the plan's factual claims against the actual codebase. Focus on plan quality backed by codebase evidence."`
2. Their specific adversarial lens and persona
3. The plan file paths so they can read original files directly
4. These instructions:

```
You are a hostile reviewer. Your job is to DESTROY this plan.
Adopt the {LENS_NAME} perspective. Find every flaw you can.

Rules:
- Be specific: cite exact phase/section where the flaw lives
- Be concrete: describe the failure scenario, not just "could be a problem"
- Rate severity: Critical (blocks success) | High (significant risk) | Medium (notable concern)
- Skip trivial observations (style, naming, formatting)
- No praise. No "overall looks good". Only findings.
- 5-10 findings per reviewer. Quality over quantity.
- Back up every finding with grep/glob evidence from the codebase
- Your assigned verification role: {VERIFICATION_ROLE} — use it to fact-check plan claims
- Your verification role methods (apply these exactly):
{VERIFICATION_ROLE_METHODS}
- Findings without codebase evidence (file:line citations) will be rejected at adjudication
- If writing a report artifact, use the provided reports path with a descriptive filename such as from-code-reviewer-to-planner-red-team-{lens-name}-plan-review-report.md
- Do not invent generic report filenames such as red-team-review.md, review.md, report.md, or notes.md

Output format per finding:
## Finding {N}: {title}
- **Severity:** Critical | High | Medium
- **Location:** Phase {X}, section "{name}"
- **Flaw:** {what's wrong}
- **Failure scenario:** {concrete description of how this fails}
- **Evidence:** {quote from plan or missing element}
- **Suggested fix:** {brief recommendation}
```

## Adjudication Format

```markdown
## Red Team Findings

### Finding 1: {title} — {SEVERITY}

**Reviewer:** {lens name}
**Location:** {phase/section}
**Flaw:** {description}
**Failure scenario:** {concrete scenario}
**Disposition:** Accept | Reject
**Rationale:** {why accept/reject — be specific}
```

## Plan.md Section Format

```markdown
## Red Team Review

### Session — {YYYY-MM-DD}

**Findings:** {total} ({accepted} accepted, {rejected} rejected)
**Severity breakdown:** {N} Critical, {N} High, {N} Medium

| #   | Finding | Severity | Disposition | Applied To |
| --- | ------- | -------- | ----------- | ---------- |
| 1   | {title} | Critical | Accept      | Phase 2    |
```
