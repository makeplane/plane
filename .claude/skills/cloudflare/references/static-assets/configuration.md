## Configuration

### Basic Setup

Minimal configuration requires only `assets.directory`:

```jsonc
{
  "name": "my-worker",
  "compatibility_date": "2025-01-01",  // Use current date for new projects
  "assets": {
    "directory": "./dist"
  }
}
```

### Full Configuration Options

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "html_handling": "auto-trailing-slash",
    "run_worker_first": ["/api/*", "!/api/docs/*"]
  }
}
```

**Configuration keys:**

- `directory` (string, required): Path to assets folder (e.g. `./dist`, `./public`, `./build`)
- `binding` (string, optional): Name to access assets in Worker code (e.g. `env.ASSETS`). Default: `"ASSETS"`
- `not_found_handling` (string, optional): Behavior when asset not found
  - `"single-page-application"`: Serve `/index.html` for non-asset paths (default for SPAs)
  - `"404-page"`: Serve `/404.html` if present, otherwise 404
  - `"none"`: Return 404 for missing assets
- `html_handling` (string, optional): URL trailing slash behavior
- `run_worker_first` (boolean | string[], optional): Routes that invoke Worker before checking assets

### not_found_handling Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `"single-page-application"` | Serve `/index.html` for non-asset requests | React, Vue, Angular SPAs |
| `"404-page"` | Serve `/404.html` if exists, else 404 | Static sites with custom error page |
| `"none"` | Return 404 for missing assets | API-first or custom routing |

### html_handling Modes

Controls trailing slash behavior for HTML files:

| Mode | `/page` | `/page/` | Use Case |
|------|---------|----------|----------|
| `"auto-trailing-slash"` | Redirect to `/page/` if `/page/index.html` exists | Serve `/page/index.html` | Default, SEO-friendly |
| `"force-trailing-slash"` | Always redirect to `/page/` | Serve if exists | Consistent trailing slashes |
| `"drop-trailing-slash"` | Serve if exists | Redirect to `/page` | Cleaner URLs |
| `"none"` | No modification | No modification | Custom routing logic |

**Default:** `"auto-trailing-slash"`

### run_worker_first Configuration

Controls which requests invoke Worker before checking assets.

**Boolean syntax:**

```jsonc
{
  "assets": {
    "run_worker_first": true  // ALL requests invoke Worker
  }
}
```

**Array syntax (recommended):**

```jsonc
{
  "assets": {
    "run_worker_first": [
      "/api/*",           // Positive pattern: match API routes
      "/admin/*",         // Match admin routes
      "!/admin/assets/*"  // Negative pattern: exclude admin assets
    ]
  }
}
```

**Pattern rules:**

- Glob patterns: `*` (any chars), `**` (any path segments)
- Negative patterns: Prefix with `!` to exclude
- Precedence: Negative patterns override positive patterns
- Default: `false` (assets served directly)

**Decision guidance:**

- Use `true` for API-first apps (few static assets)
- Use array patterns for hybrid apps (APIs + static assets)
- Use `false` for static-first sites (minimal dynamic routes)

### .assetsignore File

Exclude files from upload using `.assetsignore` (same syntax as `.gitignore`):

```
# .assetsignore
_worker.js
*.map
*.md
node_modules/
.git/
```

**Common patterns:**

- `_worker.js` - Exclude Worker code from assets
- `*.map` - Exclude source maps
- `*.md` - Exclude markdown files
- Development artifacts

### Vite Plugin Integration

For Vite-based projects, use `@cloudflare/vite-plugin`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [
    cloudflare({
      assets: {
        directory: './dist',
        binding: 'ASSETS'
      }
    })
  ]
});
```

**Features:**

- Automatic asset detection during dev
- Hot module replacement for assets
- Production build integration
- Requires: Wrangler 4.0.0+, `@cloudflare/vite-plugin` 1.0.0+

### Key Compatibility Dates

| Date | Feature | Impact |
|------|---------|--------|
| `2025-04-01` | Navigation request optimization | SPAs skip Worker for navigation, reducing costs |

Use current date for new projects. See [Compatibility Dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) for full list.

### Environment-Specific Configuration

Use `wrangler.jsonc` environments for different configs:

```jsonc
{
  "name": "my-worker",
  "assets": { "directory": "./dist" },
  "env": {
    "staging": {
      "assets": {
        "not_found_handling": "404-page"
      }
    },
    "production": {
      "assets": {
        "not_found_handling": "single-page-application"
      }
    }
  }
}
```

Deploy with: `wrangler deploy --env staging`
