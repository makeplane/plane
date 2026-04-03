# Parallel Review Workflow

**Ultrathink** to exhaustively list ALL potential edge cases, then dispatch parallel `code-reviewer` agents to verify: <scope>$ARGUMENTS</scope>

**IMPORTANT:** Activate needed skills. Ensure token efficiency. Sacrifice grammar for concision.

## Workflow

### 1. Ultrathink Edge Cases

Main agent deeply analyzes the scope to LIST all potential edge cases FIRST:
- Read `codebase-summary.md` for context
- Use `/ck:scout` to find relevant files
- **Think exhaustively** about what could go wrong:
  - Null/undefined scenarios
  - Boundary conditions (off-by-one, empty, max values)
  - Error handling gaps
  - Race conditions, async edge cases
  - Input validation holes
  - Security vulnerabilities
  - Resource leaks
  - Untested code paths

**Output format:**
```markdown
## Edge Cases Identified

### Category: [scope-area]
1. [edge case description] → files: [file1, file2]
```

### 2. Categorize & Assign

Group edge cases by similar scope for parallel verification:
- Each category → one `code-reviewer` agent
- Max 6 categories (merge small ones)
- Each reviewer gets specific edge cases to VERIFY, not discover

### 3. Parallel Verification

Launch N `code-reviewer` subagents simultaneously:
- Pass: category name, list of edge cases, relevant files
- Task: **VERIFY** if each edge case is properly handled in code
- Report: which edge cases are handled vs unhandled

### 4. Aggregate Results

```markdown
## Edge Case Verification Report

### Summary
- Total edge cases: X
- Handled: Y
- Unhandled: Z
- Partial: W

### Unhandled Edge Cases (Need Fix)
| # | Edge Case | File | Status |
|---|-----------|------|--------|
```

### 5. Adversarial Review (Always-On)

After aggregation, spawn adversarial reviewer (see `adversarial-review.md`) on the full scope:
- Adversarial reviewer receives aggregated findings + unhandled edge cases as context
- Actively tries to break the code beyond what edge case verification found
- Adjudicate findings: Accept / Reject / Defer

### 6. Auto-Fix Pipeline

**IF** unhandled/partial edge cases found:
- Ask: "Found N unhandled edge cases. Fix with /ck:fix --parallel? [Y/n]"

### 7. Final Report
- Summary of verification
- Ask: "Commit? [Y/n]" → use `git-manager`
