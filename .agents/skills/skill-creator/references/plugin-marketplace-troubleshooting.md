# Plugin Marketplace Troubleshooting

## Marketplace Not Loading

**Symptoms:** Can't add marketplace or see plugins.

**Checklist:**
- Marketplace URL accessible?
- `.claude-plugin/marketplace.json` exists at specified path?
- JSON syntax valid? Run `claude plugin validate .` or `/plugin validate .`
- Private repo — do you have access permissions?

## Validation Errors

Run `claude plugin validate .` from marketplace directory. Common errors:

| Error | Cause | Fix |
|-------|-------|-----|
| `File not found: .claude-plugin/marketplace.json` | Missing manifest | Create with required fields |
| `Invalid JSON syntax: Unexpected token...` | JSON syntax error | Fix commas, quotes, brackets |
| `Duplicate plugin name "x"` | Two plugins share name | Give unique `name` values |
| `plugins[0].source: Path traversal not allowed` | Source contains `..` | Use paths relative to root, no `..` |

**Warnings (non-blocking):**
- `Marketplace has no plugins defined` — add plugins to array
- `No marketplace description provided` — add `metadata.description`
- `Plugin "x" uses npm source` — npm not fully implemented, use github/local

## Plugin Installation Failures

**Symptoms:** Marketplace appears but install fails.

**Checklist:**
- Plugin source URLs accessible?
- Plugin directories contain required files?
- GitHub sources — repos public or you have access?
- Test manually by cloning/downloading source

## Private Repository Auth Fails

### Manual Install/Update
- Authenticated with git provider? `gh auth status` for GitHub
- Credential helper configured? `git config --global credential.helper`
- Can you clone repo manually?

### Background Auto-Updates
- Token set in environment? `echo $GITHUB_TOKEN`
- Token has required permissions?
  - GitHub: `repo` scope for private repos
  - GitLab: `read_repository` scope minimum
- Token not expired?

## Relative Paths Fail in URL-Based Marketplaces

**Symptoms:** Added marketplace via URL, plugins with `"./plugins/my-plugin"` source fail.

**Cause:** URL-based marketplaces only download `marketplace.json`, not plugin files. Relative paths reference files on remote server that weren't downloaded.

**Fixes:**
1. **Use external sources:**
   ```json
   { "name": "my-plugin", "source": { "source": "github", "repo": "owner/repo" } }
   ```
2. **Use Git-based marketplace:** Host in Git repo, add via git URL. Clones entire repo, relative paths work.

## Files Not Found After Installation

**Symptoms:** Plugin installs but file references fail, especially outside plugin directory.

**Cause:** Plugins copied to cache directory, not used in-place. Paths like `../shared-utils` won't work.

**Fixes:**
- Use symlinks (followed during copying)
- Restructure so shared directory is inside plugin source path
- Use `${CLAUDE_PLUGIN_ROOT}` in hooks/MCP configs for cache-aware paths
- See [Plugin caching docs](https://code.claude.com/docs/en/plugins-reference.md#plugin-caching-and-file-resolution)
