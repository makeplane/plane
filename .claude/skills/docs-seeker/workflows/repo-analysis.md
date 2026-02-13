# Repository Analysis (No llms.txt)

**Use when:** llms.txt not available on context7.com or official site

**Speed:** ⚡⚡⚡ Slower (5-10min)
**Token usage:** 🔴 High
**Accuracy:** 🔍 Code-based

## When to Use

- Library not on context7.com
- No llms.txt on official site
- Need to analyze code structure
- Documentation incomplete

## Workflow

```
1. Find repository
   → WebSearch: "[library] github repository"
   → Verify: Official, active, has docs/

2. Clone repository
   → Bash: git clone [repo-url] /tmp/docs-analysis
   → Optional: checkout specific version/tag

3. Install Repomix (if needed)
   → Bash: npm install -g repomix

4. Pack repository
   → Bash: cd /tmp/docs-analysis && repomix --output repomix-output.xml
   → Repomix creates AI-friendly single file

5. Read packed file
   → Read: /tmp/docs-analysis/repomix-output.xml
   → Extract: README, docs/, examples/, API files

6. Analyze structure
   → Identify: Documentation sections
   → Extract: Installation, usage, API, examples
   → Note: Code patterns, best practices

7. Present findings
   → Source: Repository analysis
   → Caveat: Based on code, not official docs
   → Include: Repository health (stars, activity)
```

## Example

**Obscure library without llms.txt:**
```bash
# 1. Find
WebSearch: "MyLibrary github repository"
# Found: https://github.com/org/mylibrary

# 2. Clone
git clone https://github.com/org/mylibrary /tmp/docs-analysis

# 3. Pack with Repomix
cd /tmp/docs-analysis
repomix --output repomix-output.xml

# 4. Read
Read: /tmp/docs-analysis/repomix-output.xml
# Single XML file with entire codebase

# 5. Extract documentation
- README.md: Installation, overview
- docs/: Usage guides, API reference
- examples/: Code samples
- src/: Implementation patterns

# 6. Present
Source: Repository analysis (no llms.txt)
Health: 1.2K stars, active
```

## Repomix Benefits

✅ Entire repo in single file
✅ Preserves directory structure
✅ AI-optimized format
✅ Includes metadata

## Alternative

If no GitHub repo exists:
→ Deploy multiple Researcher agents
→ Gather: Official site, blog posts, tutorials, Stack Overflow
→ Note: Quality varies, cross-reference sources
