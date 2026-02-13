# Advanced Scenarios & Edge Cases

## Multi-Language Documentation

**Challenge:** Docs in multiple languages

**Approach:**
1. Identify target language from user
2. Search for language-specific llms.txt
   - `llms-es.txt`, `llms-ja.txt`
3. Fallback to English if not found
4. Note language limitations in report

## Version-Specific Documentation

**Latest (default):**
- Use base llms.txt URL
- No version specifier needed

**Specific version:**
```
WebSearch: "[library] v[version] llms.txt"
Check paths:
- /v2/llms.txt
- /docs/v2/llms.txt
- /{version}/llms.txt

For repos:
git checkout v[version] or tags/[version]
```

## Framework with Plugins

**Challenge:** Core framework + 50 plugins

**Strategy:**
1. Focus on core framework first
2. Ask user which plugins needed
3. Launch targeted search for specific plugins
4. Note available plugins in report
5. Don't document everything upfront

## Documentation Under Construction

**Signs:**
- New release with incomplete docs
- Many "Coming soon" pages
- GitHub issues requesting docs

**Approach:**
1. Note status upfront in report
2. Combine available docs + repo analysis
3. Check tests/ and examples/ directories
4. Clearly mark "inferred from code"
5. Link to GitHub issues for updates

## Conflicting Information

**When sources disagree:**
1. Identify primary official source
2. Note version differences
3. Present both approaches with context
4. Recommend official/latest
5. Explain why conflict exists

**Priority order:**
1. Official docs (latest version)
2. Official docs (versioned)
3. GitHub README
4. Community tutorials
5. Stack Overflow

## Rate Limiting

**If hitting API limits:**
- Use CONTEXT7_API_KEY from .env
- Implement exponential backoff
- Cache results in session
- Batch requests where possible
