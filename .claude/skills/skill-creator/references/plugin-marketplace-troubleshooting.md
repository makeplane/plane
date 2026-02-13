# Plugin Marketplace Troubleshooting

## Marketplace Not Loading

**Symptoms:** Can't add marketplace or see plugins

**Solutions:**
- Verify marketplace URL is accessible
- Check `.claude-plugin/marketplace.json` exists at specified path
- Validate JSON syntax: `claude plugin validate .` or `/plugin validate .`
- For private repos, confirm access permissions

## Marketplace Validation Errors

Run `claude plugin validate .` or `/plugin validate .` from marketplace directory.

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `File not found: .claude-plugin/marketplace.json` | Missing manifest | Create `.claude-plugin/marketplace.json` with required fields |
| `Invalid JSON syntax: Unexpected token...` | JSON syntax error | Check for missing/extra commas, unquoted strings |
| `Duplicate plugin name "x" found` | Two plugins share same name | Give each plugin unique `name` value |
| `plugins[0].source: Path traversal not allowed` | Source path contains `..` | Use paths relative to marketplace root without `..` |

### Warnings (Non-blocking)

- `Marketplace has no plugins defined`: Add at least one plugin to `plugins` array
- `No marketplace description provided`: Add `metadata.description`
- `Plugin "x" uses npm source...`: Use `github` or local path sources instead

## Plugin Installation Failures

**Symptoms:** Marketplace appears but installation fails

**Solutions:**
- Verify plugin source URLs are accessible
- Check plugin directories contain required files
- For GitHub sources, ensure repos are public or you have access
- Test plugin sources manually by cloning/downloading

## Private Repository Authentication Fails

### Manual Installation

- Verify authentication: `gh auth status` for GitHub
- Check credential helper: `git config --global credential.helper`
- Try cloning repository manually

### Background Auto-Updates

- Verify token set: `echo $GITHUB_TOKEN`
- Check token permissions (read access to repository)
- GitHub: ensure `repo` scope for private repos
- GitLab: ensure at least `read_repository` scope
- Verify token not expired

## Relative Paths Fail in URL-based Marketplaces

**Symptoms:** Added via URL (like `https://example.com/marketplace.json`), plugins with `"./plugins/my-plugin"` fail with "path not found"

**Cause:** URL-based marketplaces only download `marketplace.json` file, not plugin files.

**Solutions:**
- Use external sources (GitHub, npm, git URL) instead of relative paths:
  ```json
  { "name": "my-plugin", "source": { "source": "github", "repo": "owner/repo" } }
  ```
- Use Git-based marketplace (clones entire repo, relative paths work)

## Files Not Found After Installation

**Symptoms:** Plugin installs but references to files fail, especially files outside plugin directory

**Cause:** Plugins copied to cache directory. Paths like `../shared-utils` won't work.

**Solutions:**
- Use symlinks (followed during copying)
- Restructure so shared directory is inside plugin source path
- Reference: Plugin caching and file resolution docs
