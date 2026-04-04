# Commit Convention

You MUST use conventional commits:

```
type(scope): subject
```

**Types:** feat, fix, refactor, docs, test, chore, perf, ci
**Scope:** module or area affected (optional but recommended)
**Subject:** imperative mood, lowercase, no period

When AI generates a commit, you MUST append:
```
Co-Authored-By: <model name> <noreply@anthropic.com>
```

Examples:
- `feat(auth): add OAuth2 login flow`
- `fix(api): handle null response from payment gateway`
- `docs(readme): update installation instructions`
