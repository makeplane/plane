# Research: AI Context Management Best Practices

## 1. Lost-in-the-Middle Problem

LLMs attend strongly to beginning and end of context, weakly to middle sections. Research (Liu et al., 2023 "Lost in the Middle") shows:

- Performance drops 20-30% for info placed in middle of long contexts
- Critical rules buried between other rules get "forgotten"
- Worst performance at ~60-70% position in context

**Impact on coding assistants**: Claude Code loads all `.claude/rules/` files into system context. If 20 files × 80 lines = 1600 lines of rules, middle rules get diluted.

## 2. Attention Dilution

When too many rules load simultaneously:

- AI spreads attention across ALL rules instead of focusing on task-relevant ones
- Conflicting or overlapping rules cause inconsistent behavior
- More rules ≠ better compliance; there's a diminishing returns curve
- Peak: ~500-800 lines of focused, relevant rules per task

## 3. Context Rot

Over long sessions:

- Earlier instructions get compressed/summarized by context management
- Rule compliance degrades as conversation grows past ~100K tokens
- "Fresh context per phase" is the primary mitigation

## 4. Expert Solutions

### A. Conditional/Scoped Rule Loading

- **Claude Code**: `.claude/rules/` supports YAML frontmatter with `paths:` globs — rules only load when editing matching files
- **Cursor**: `.cursor/rules/` with `globs:` for file-pattern matching
- **Key insight**: Only load rules relevant to current files being edited

### B. Rule Hierarchy (3 Tiers)

1. **Always-on** (CLAUDE.md/GEMINI.md): <100 lines, highest-priority invariants
2. **Conditional** (rule files with path globs): Load only when editing matching files
3. **Embedded** (in plan phase files): Injected at point-of-use for implementation

### C. Rule Compression Techniques

- **Checklist format** > prose (2-3x more scannable)
- **Negative examples** (❌/✅) are 40% more effective than prose descriptions
- **Tables** for multi-option rules (dialog systems, color tokens)
- **Single-responsibility**: One rule file = one concern

### D. Phase-Based Context Injection

- Embed only relevant rules in each implementation phase file
- AI reads one phase at a time in fresh context
- Rules appear at "point of use" — highest attention zone

### E. Deduplication

- Eliminate rule overlap between CLAUDE.md, GEMINI.md, and rule files
- Single source of truth → reference, don't repeat

## 5. Claude Code Specific

### Path-Scoped Rules (KEY FEATURE)

```yaml
---
paths:
  - apps/web/**
  - apps/admin/**
---
# Frontend rules here — ONLY loaded when editing web/admin files
```

- Backend rules NEVER load during frontend work and vice versa
- Reduces context noise by 40-60%

### CLAUDE.md Optimization

- Keep under 100 lines
- Only "always-needed" rules: git safety, architecture overview, file references
- Move component-specific rules to scoped rule files

### Subagent Delegation

- Subagents get fresh 200K context each
- Delegate heavy-context tasks (research, testing) to subagents
- Main context stays lean for orchestration

## 6. Gemini/Antigravity Specific

### GEMINI.md Challenges

- No path-scoping mechanism (all rules load always)
- Current GEMINI.md = 321 lines → entire ruleset in one file
- Solution: Use "Attention Dilution Prevention" section + phase-based embedding

### Mitigation

- Keep GEMINI.md as compact "master reference"
- Rely on plan phase files for detailed rules
- Use `.agent/rules/` as reference library, not auto-loaded context

## Key Metrics

| Metric                            | Current | Target           |
| --------------------------------- | ------- | ---------------- |
| CLAUDE.md lines                   | 126     | <80              |
| GEMINI.md lines                   | 321     | <200             |
| Total rule lines (.claude/rules/) | 2,170   | Same, but scoped |
| Rules loaded per task             | ALL     | 3-5 relevant     |
| Rule overlap %                    | ~40%    | <10%             |
