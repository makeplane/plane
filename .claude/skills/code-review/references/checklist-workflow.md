# Checklist-Based Review Workflow

How to apply structured review checklists during code review.

## When to Use

- Pre-landing review (from `/ck:ship` pipeline)
- Explicit request for checklist review
- Security audit before release
- Code-reviewer agent when reviewing significant changes (10+ files or security-sensitive)

## Workflow

### 1. Auto-Detect Project Type

```bash
# Check for web app frameworks
if grep -qE '"(react|vue|svelte|next|nuxt|angular)"' package.json 2>/dev/null; then
  echo "web-app"
# Check for API patterns
elif ls src/routes/ src/api/ src/controllers/ app/controllers/ 2>/dev/null | head -1; then
  echo "api"
else
  echo "base-only"
fi
```

### 2. Load Checklists

Always load: `checklists/base.md`

Overlay based on detection:
- `web-app` → also load `checklists/web-app.md`
- `api` → also load `checklists/api.md`
- Both detected → load both overlays

### 3. Get the Diff

```bash
git fetch origin main --quiet
git diff origin/main
```

**CRITICAL:** Read the FULL diff before flagging anything. Checklist suppressions require full context.

### 4. Two-Pass Review

**Pass 1 (CRITICAL) — Run first:**
- Scan diff against ALL critical categories (base + overlays)
- Each finding must include: `[file:line]`, problem, fix
- These block `/ship` pipeline

**Pass 2 (INFORMATIONAL) — Run second:**
- Scan diff against ALL informational categories (base + overlays)
- Same format: `[file:line]`, problem, fix
- Included in PR body but don't block

### 5. Check Suppressions

Before reporting any finding, verify it's NOT in the suppressions list (bottom of `base.md`).

Key suppressions:
- Already addressed in the diff
- Readability-aiding redundancy
- Style/formatting issues
- "Consider using X" when Y works fine

### 6. Output

```
Pre-Landing Review: N issues (X critical, Y informational)

**CRITICAL** (blocking):
- [src/auth/login.ts:42] SQL injection via string interpolation in user lookup
  Fix: Use parameterized query: `db.query('SELECT * FROM users WHERE email = $1', [email])`

**Issues** (non-blocking):
- [src/api/users.ts:88] Magic number 30 for pagination limit
  Fix: Extract to constant `DEFAULT_PAGE_SIZE = 30`
```

### 7. Critical Issue Resolution

For each critical issue, use `AskUserQuestion`:
- Problem with `file:line`
- Recommended fix
- Options:
  - A) Fix now (recommended)
  - B) Acknowledge and proceed
  - C) False positive — skip

If user chose A (fix): apply fixes, commit, then re-run tests before continuing.

## Integration with /ck:ship

The ship pipeline calls this workflow at Step 4. Critical findings block the pipeline. Informational findings are included in the PR body.

## Integration with /ck:code-review

When invoked as part of standard code review, the checklist augments (not replaces) the existing scout → review → fix → verify pipeline. Checklist findings are merged with code-reviewer's own findings.
