# Step 0: Scope Challenge

Run BEFORE research or design. Forces intent clarification before investing time.

**Inspired by:** gstack `/plan-eng-review` Step 0 + `/plan-ceo-review` scope modes.

## Skip Conditions

Skip Step 0 when:
- `--fast` mode explicitly set (user already wants minimal)
- Task is clearly trivial (single file fix, typo, config change)
- User says "just plan it", "quick", or similar urgency signal
- Task description is under 20 words and unambiguous

## The 3 Questions

Before planning, answer these concisely:

### 1. What already exists?
- Scan codebase for code that partially/fully solves sub-problems
- Check existing utilities, services, patterns that can be reused
- Flag if plan would rebuild something that exists

### 2. What is the minimum change set?
- Identify work that could be deferred without blocking core goal
- Flag scope creep: nice-to-haves disguised as requirements
- Be ruthless about what's truly necessary vs aspirational

### 3. Complexity check
- If plan would touch **>8 files**: challenge whether same goal achievable with fewer
- If plan would introduce **>2 new classes/services**: smell — justify each
- If plan would have **>3 phases**: consider if phases can be merged

## Scope Modes

After answering the 3 questions, present via `AskUserQuestion`:

**Header:** "Scope Challenge"
**Question:** "Based on analysis, how should we scope this plan?"

| Option | Label | Description |
|--------|-------|-------------|
| A | **SCOPE EXPANSION** | Dream big — explore the 10-star version, research deeply, add delight features |
| B | **HOLD SCOPE** | Scope is right — focus on bulletproof execution, edge cases, test coverage |
| C | **SCOPE REDUCTION** | Strip to essentials — defer everything non-blocking, minimal phases |

## After Selection

### EXPANSION selected
- Suggest `--hard` or `--two` mode if not already set
- Research phase should explore alternatives and adjacent features
- Plan should include "stretch" items clearly labeled
- More phases are acceptable

### HOLD selected
- Proceed with auto-detected mode
- Respect scope exactly — no silent reduction or expansion
- Focus on failure modes, edge cases, test coverage
- Standard number of phases

### REDUCTION selected
- Suggest `--fast` mode if not already set
- Propose minimal version that achieves core goal
- Defer everything non-critical to "NOT in scope" section
- Fewer phases, simpler architecture

## Critical Rule

**Once user selects a mode, RESPECT IT.**

Do not:
- Silently reduce scope when user chose HOLD or EXPANSION
- Silently expand scope when user chose REDUCTION
- Re-argue for different scope in later review sections

Raise scope concerns ONCE in Step 0. After that, commit to chosen scope and optimize within it.

## Output Format

After scope challenge, output brief summary before proceeding:

```
Scope Challenge:
- Existing code: [what was found that's reusable]
- Minimum changes: [what's essential vs deferrable]
- Complexity: [estimated files, new abstractions]
- Selected mode: [EXPANSION/HOLD/REDUCTION]
```

Then proceed to mode detection and research phase.
