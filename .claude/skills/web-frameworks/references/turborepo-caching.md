# Turborepo Caching Strategies

Local caching, remote caching, cache invalidation, and optimization techniques.

## Local Caching

### How It Works

Turborepo caches task outputs based on inputs:

1. **Hash inputs**: Source files, dependencies, environment variables, config
2. **Run task**: If hash not in cache
3. **Save outputs**: Store in `.turbo/cache`
4. **Restore on match**: Instant completion on cache hit

Default cache location: `./node_modules/.cache/turbo`

### Cache Configuration

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "cache": true  // default
    },
    "dev": {
      "cache": false  // don't cache dev servers
    }
  }
}
```

### Outputs Configuration

Specify what gets cached:

```json
{
  "build": {
    "outputs": [
      "dist/**",              // All files in dist
      "build/**",             // Build directory
      ".next/**",             // Next.js output
      "!.next/cache/**",      // Exclude Next.js cache
      "storybook-static/**",  // Storybook build
      "*.tsbuildinfo"         // TypeScript build info
    ]
  }
}
```

**Best practices:**
- Include all build artifacts
- Exclude nested caches
- Include type definitions
- Include generated files

### Clear Local Cache

```bash
# Remove cache directory
rm -rf ./node_modules/.cache/turbo

# Or use turbo command with --force
turbo run build --force

# Clear and rebuild
turbo run clean && turbo run build
```

## Remote Caching

Share cache across team and CI/CD.

### Vercel Remote Cache (Recommended)

**Setup:**
```bash
# Login to Vercel
turbo login

# Link repository
turbo link
```

**Use in CI:**
```yaml
# .github/workflows/ci.yml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

steps:
  - run: turbo run build test
```

Get tokens from Vercel dashboard:
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Add as GitHub secrets

### Custom Remote Cache

Configure custom remote cache server:

```json
// .turbo/config.json
{
  "teamid": "team_xxx",
  "apiurl": "https://cache.example.com",
  "token": "your-token"
}
```

Or use environment variables:
```bash
export TURBO_API="https://cache.example.com"
export TURBO_TOKEN="your-token"
export TURBO_TEAM="team_xxx"
```

### Remote Cache Verification

```bash
# Check cache status
turbo run build --output-logs=hash-only

# Output shows:
# • web:build: cache hit, replaying logs [hash]
# • api:build: cache miss, executing [hash]
```

## Cache Signatures

Cache invalidated when these change:

### 1. Source Files

All tracked Git files in package:
```
packages/ui/
├── src/
│   ├── button.tsx     # Tracked
│   └── input.tsx      # Tracked
├── dist/              # Ignored (in .gitignore)
└── node_modules/      # Ignored
```

### 2. Package Dependencies

Changes in package.json:
```json
{
  "dependencies": {
    "react": "18.2.0"  // Version change invalidates cache
  }
}
```

### 3. Environment Variables

Configured in pipeline:
```json
{
  "build": {
    "env": ["NODE_ENV", "API_URL"]  // Changes invalidate cache
  }
}
```

### 4. Global Dependencies

Files affecting all packages:
```json
{
  "globalDependencies": [
    "**/.env.*local",
    "tsconfig.json",
    ".eslintrc.js"
  ]
}
```

### 5. Task Configuration

Changes to turbo.json pipeline:
```json
{
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["dist/**"]  // Config changes invalidate cache
  }
}
```

## Input Control

### Override Input Detection

Explicitly define what affects cache:

```json
{
  "build": {
    "inputs": [
      "src/**/*.ts",           // Include TS files
      "src/**/*.tsx",          // Include TSX files
      "!src/**/*.test.ts",     // Exclude tests
      "!src/**/*.stories.tsx", // Exclude stories
      "package.json",          // Include package.json
      "tsconfig.json"          // Include config
    ]
  }
}
```

Use cases:
- Exclude test files from build cache
- Exclude documentation from production builds
- Include only source files, not generated files

### Global vs Package Inputs

**Global inputs** (affect all packages):
```json
{
  "globalDependencies": [".env", "tsconfig.json"]
}
```

**Package inputs** (affect specific tasks):
```json
{
  "pipeline": {
    "build": {
      "inputs": ["src/**"]
    }
  }
}
```

## Environment Variables

### Cached Environment Variables

Include in cache signature:

```json
{
  "pipeline": {
    "build": {
      "env": [
        "NODE_ENV",           // Must match for cache hit
        "NEXT_PUBLIC_API_URL",
        "DATABASE_URL"
      ]
    }
  }
}
```

Cache invalidated when values change.

### Pass-Through Environment Variables

Don't affect cache:

```json
{
  "pipeline": {
    "build": {
      "passThroughEnv": [
        "DEBUG",        // Different values use same cache
        "LOG_LEVEL",
        "VERBOSE"
      ]
    }
  }
}
```

Use for: Debug flags, log levels, non-production settings

### Global Environment Variables

Available to all tasks:

```json
{
  "globalEnv": [
    "NODE_ENV",
    "CI",
    "VERCEL"
  ]
}
```

## Cache Optimization Strategies

### 1. Granular Outputs

Define precise outputs to minimize cache size:

```json
// ❌ Bad - caches too much
{
  "build": {
    "outputs": ["**"]
  }
}

// ✅ Good - specific outputs
{
  "build": {
    "outputs": ["dist/**", "!dist/**/*.map"]
  }
}
```

### 2. Exclude Unnecessary Files

```json
{
  "build": {
    "outputs": [
      ".next/**",
      "!.next/cache/**",      // Exclude Next.js cache
      "!.next/server/**/*.js.map",  // Exclude source maps
      "!.next/static/**/*.map"
    ]
  }
}
```

### 3. Separate Cacheable Tasks

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true  // Separate from build
    },
    "dev": {
      "cache": false  // Never cache
    }
  }
}
```

### 4. Use Input Filters

Only track relevant files:

```json
{
  "build": {
    "inputs": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.{test,spec}.{ts,tsx}",
      "public/**",
      "package.json"
    ]
  }
}
```

## Cache Analysis

### Inspect Cache Hits/Misses

```bash
# Dry run with JSON output
turbo run build --dry-run=json | jq '.tasks[] | {package: .package, task: .task, cache: .cache}'
```

### View Task Graph

```bash
# Generate task graph
turbo run build --graph

# Output: graph.html (open in browser)
```

### Cache Statistics

```bash
# Run with summary
turbo run build --summarize

# Output: .turbo/runs/[hash].json
```

## CI/CD Cache Configuration

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build and test
        run: turbo run build test lint
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      # Optional: Cache node_modules
      - uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### GitLab CI

```yaml
image: node:18

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .turbo/

build:
  stage: build
  script:
    - npm install
    - turbo run build test
  variables:
    TURBO_TOKEN: $TURBO_TOKEN
    TURBO_TEAM: $TURBO_TEAM
```

## Troubleshooting

### Cache Not Working

**Check outputs are defined:**
```bash
turbo run build --dry-run=json | jq '.tasks[] | {task: .task, outputs: .outputs}'
```

**Verify cache location:**
```bash
ls -la ./node_modules/.cache/turbo
```

**Check environment variables:**
```bash
echo $TURBO_TOKEN
echo $TURBO_TEAM
```

### Cache Too Large

**Analyze cache size:**
```bash
du -sh ./node_modules/.cache/turbo
```

**Reduce outputs:**
```json
{
  "build": {
    "outputs": [
      "dist/**",
      "!dist/**/*.map",      // Exclude source maps
      "!dist/**/*.test.js"   // Exclude test files
    ]
  }
}
```

**Clear old cache:**
```bash
# Turborepo doesn't auto-clean, manually remove:
rm -rf ./node_modules/.cache/turbo
```

### Remote Cache Connection Issues

**Test connection:**
```bash
curl -I https://cache.example.com
```

**Verify token:**
```bash
turbo link
# Should show: "Remote caching enabled"
```

**Check logs:**
```bash
turbo run build --output-logs=full
```

## Best Practices

1. **Define precise outputs** - Only cache necessary files
2. **Exclude nested caches** - Don't cache caches (.next/cache)
3. **Use remote caching** - Share cache across team and CI
4. **Track relevant inputs** - Use `inputs` to filter files
5. **Separate env vars** - Use `passThroughEnv` for debug flags
6. **Cache test results** - Include coverage in outputs
7. **Don't cache dev servers** - Set `cache: false` for dev tasks
8. **Use global dependencies** - Share config across packages
9. **Monitor cache performance** - Use `--summarize` to analyze
10. **Clear cache periodically** - Remove stale cache manually

## Cache Performance Tips

**For CI/CD:**
- Enable remote caching
- Run only changed packages: `--filter='...[origin/main]'`
- Use `--continue` to see all errors
- Cache node_modules separately

**For Local Development:**
- Keep local cache enabled
- Don't force rebuild unless needed
- Use filters to build only what changed
- Clear cache if issues arise

**For Large Monorepos:**
- Use granular outputs
- Implement input filters
- Monitor cache size regularly
- Consider cache size limits on remote cache
