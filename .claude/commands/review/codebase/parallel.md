---
description: ⚡⚡⚡ Ultrathink edge cases, then parallel verify with code-reviewers
argument-hint: [scope-or-prompt]
---

**Ultrathink** to exhaustively list ALL potential edge cases, then dispatch parallel `code-reviewer` agents to verify: <scope>$ARGUMENTS</scope>

**IMPORTANT:** Activate needed skills. Ensure token efficiency. Sacrifice grammar for concision.

## Workflow

### 1. Ultrathink Edge Cases

Main agent deeply analyzes the scope to LIST all potential edge cases FIRST:
- Read `codebase-summary.md` for context
- Use `/scout:ext` to find relevant files
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
2. [edge case description] → files: [file3]

### Category: [another-area]
1. [edge case description] → files: [file4, file5]
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

**Reviewer instruction:**
```
Verify these specific edge cases in the given files:
[list of edge cases]

For each, report:
- ✅ Handled: [how it's handled]
- ❌ Unhandled: [what's missing]
- ⚠️ Partial: [what needs improvement]
```

### 4. Aggregate Results

Collect all verification reports:
```markdown
## Edge Case Verification Report

### Summary
- Total edge cases: X
- Handled: Y ✅
- Unhandled: Z ❌
- Partial: W ⚠️

### Unhandled Edge Cases (Need Fix)
| # | Edge Case | File | Status |
|---|-----------|------|--------|
| 1 | ...       | ...  | ❌     |

### Partial Handling (Need Review)
| # | Edge Case | File | Issue |
|---|-----------|------|-------|
| 1 | ...       | ...  | ...   |
```

### 5. Auto-Fix Pipeline

**IF** unhandled/partial edge cases found:
- Ask: "Found N unhandled edge cases. Fix with /fix --parallel? [Y/n]"
- **IF yes:** Trigger `/fix --parallel` with unhandled list

### 6. Final Report

- Summary of verification
- Ask: "Commit? [Y/n]" → use `git-manager`

## Example

```
User: /review:codebase:parallel auth module

1. Ultrathink → Lists 12 edge cases for auth:
   - Empty password submission
   - Token expiry during request
   - Concurrent login attempts
   - Invalid refresh token
   ...

2. Categorize → 3 groups:
   - Login flow (4 cases)
   - Token handling (5 cases)
   - Session management (3 cases)

3. Parallel → 3 code-reviewers verify simultaneously

4. Aggregate → 8 handled, 3 unhandled, 1 partial

5. Fix → User approves → /fix --parallel

6. Final → Commit changes
```
