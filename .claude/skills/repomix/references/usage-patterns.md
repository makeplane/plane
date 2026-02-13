# Usage Patterns

Practical workflows and patterns for using Repomix in different scenarios.

## AI Analysis Workflows

### Full Repository
```bash
repomix --remove-comments --style markdown -o full-repo.md
```
**Use:** New codebase, architecture review, complete LLM context, planning
**Tips:** Remove comments, use markdown, check token limits, review before sharing

### Focused Module
```bash
repomix --include "src/auth/**,src/api/**" -o modules.xml
```
**Use:** Feature analysis, debugging specific areas, targeted refactoring
**Tips:** Include related files only, stay within token limits, use XML for AI

### Incremental Analysis
```bash
git checkout feature-branch && repomix --include "src/**" -o feature.xml
git checkout main && repomix --include "src/**" -o main.xml
```
**Use:** Feature branch review, change impact, before/after comparison, migration planning

### Cross-Repository
```bash
npx repomix --remote org/repo1 -o repo1.xml
npx repomix --remote org/repo2 -o repo2.xml
```
**Use:** Microservices, library comparisons, consistency checks, integration analysis

## Security Audit

### Third-Party Library
```bash
npx repomix --remote vendor/library --style xml -o audit.xml
```
**Workflow:** Package library → enable security checks → review vulnerabilities → check suspicious patterns → AI analysis
**Check for:** API keys, hardcoded credentials, network calls, obfuscation, malicious patterns

### Pre-Deployment
```bash
repomix --include "src/**,config/**" --style xml -o pre-deploy-audit.xml
```
**Checklist:** No sensitive data, no test credentials, env vars correct, security practices, no debug code

### Dependency Audit
```bash
repomix --include "**/package.json,**/package-lock.json" -o deps.md --style markdown
repomix --include "node_modules/suspicious-package/**" -o dep-audit.xml
```
**Use:** Suspicious dependency, security advisory, license compliance, vulnerability assessment

### Compliance
```bash
repomix --include "src/**,LICENSE,README.md,docs/**" --style markdown -o compliance.md
```
**Include:** Source, licenses, docs, configs. **Exclude:** Test data, dependencies

## Documentation

### Doc Context
```bash
repomix --include "src/**,docs/**,*.md" --style markdown -o doc-context.md
```
**Use:** API docs, architecture docs, user guides, onboarding
**Tips:** Include existing docs, include source, use markdown

### API Documentation
```bash
repomix --include "src/api/**,src/routes/**,src/controllers/**" --remove-comments -o api-context.xml
```
**Include:** Routes, controllers, schemas, middleware
**Workflow:** Package → AI → OpenAPI/Swagger → endpoint docs → examples

### Architecture
```bash
repomix --include "src/**/*.ts,*.md" -i "**/*.test.ts" --style markdown -o architecture.md
```
**Focus:** Module structure, dependencies, design patterns, data flow

### Examples
```bash
repomix --include "examples/**,demos/**,*.example.js" --style markdown -o examples.md
```

## Library Evaluation

### Quick Assessment
```bash
npx repomix --remote owner/library --style markdown -o library-eval.md
```
**Evaluate:** Code quality, architecture, dependencies, tests, docs, maintenance

### Feature Comparison
```bash
npx repomix --remote owner/lib-a --style xml -o lib-a.xml
npx repomix --remote owner/lib-b --style xml -o lib-b.xml
```
**Compare:** Features, API design, performance, bundle size, dependencies, maintenance

### Integration Feasibility
```bash
npx repomix --remote vendor/library --include "src/**,*.md" -o library.xml
repomix --include "src/integrations/**" -o our-integrations.xml
```
Analyze compatibility between target library and your integration points

### Migration Planning
```bash
repomix --include "node_modules/old-lib/**" -o old-lib.xml
npx repomix --remote owner/new-lib -o new-lib.xml
```
Compare current vs target library, analyze usage patterns

## Workflow Integration

### CI/CD
```yaml
# GitHub Actions
- name: Generate Snapshot
  run: |
    npm install -g repomix
    repomix --style markdown -o release-snapshot.md
- name: Upload Artifact
  uses: actions/upload-artifact@v3
  with: {name: repo-snapshot, path: release-snapshot.md}
```
**Use:** Release docs, compliance archives, change tracking, audit trails

### Git Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit
git diff --cached --name-only > staged-files.txt
repomix --include "$(cat staged-files.txt | tr '\n' ',')" -o .context/latest.xml
```

### IDE (VS Code)
```json
{"version": "2.0.0", "tasks": [{"label": "Package for AI", "type": "shell", "command": "repomix --include 'src/**' --remove-comments --copy"}]}
```

### Claude Code
```bash
repomix --style markdown --copy  # Then paste into Claude
```

## Language-Specific Patterns

### TypeScript
```bash
repomix --include "**/*.ts,**/*.tsx" --remove-comments --no-line-numbers
```
**Exclude:** `**/*.test.ts`, `dist/`, `coverage/`

### React
```bash
repomix --include "src/**/*.{js,jsx,ts,tsx},public/**" -i "build/,*.test.*"
```
**Include:** Components, hooks, utils, public assets

### Node.js Backend
```bash
repomix --include "src/**/*.js,config/**" -i "node_modules/,logs/,tmp/"
```
**Focus:** Routes, controllers, models, middleware, configs

### Python
```bash
repomix --include "**/*.py,requirements.txt,*.md" -i "**/__pycache__/,venv/"
```
**Exclude:** `__pycache__/`, `*.pyc`, `venv/`, `.pytest_cache/`

### Monorepo
```bash
repomix --include "packages/*/src/**" -i "packages/*/node_modules/,packages/*/dist/"
```
**Consider:** Package-specific patterns, shared deps, cross-package refs, workspace structure

## Troubleshooting

### Output Too Large
**Problem:** Exceeds LLM token limits
**Fix:**
```bash
repomix -i "node_modules/**,dist/**,coverage/**" --include "src/core/**" --remove-comments --no-line-numbers
```

### Missing Files
**Problem:** Expected files not included
**Debug:**
```bash
cat .gitignore .repomixignore  # Check ignore patterns
repomix --no-gitignore --no-default-patterns --verbose
```

### Sensitive Data Warnings
**Problem:** Security scanner flags secrets
**Actions:** Review files → add to `.repomixignore` → remove sensitive data → use env vars
```bash
repomix --no-security-check  # Use carefully for false positives
```

### Performance Issues
**Problem:** Slow on large repo
**Optimize:**
```bash
repomix --include "src/**/*.ts" -i "node_modules/**,dist/**,vendor/**"
```

### Remote Access
**Problem:** Cannot access remote repo
**Fix:**
```bash
npx repomix --remote https://github.com/owner/repo  # Full URL
npx repomix --remote https://github.com/owner/repo/commit/abc123  # Specific commit
# For private: clone first, run locally
```

## Best Practices

**Planning:** Define scope → identify files → check token limits → consider security

**Execution:** Start broad, refine narrow → use appropriate format → enable security checks → monitor tokens

**Review:** Verify no sensitive data → check completeness → validate format → test with LLM

**Iteration:** Refine patterns → adjust format → optimize tokens → document patterns
