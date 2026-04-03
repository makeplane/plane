# Turborepo Task Pipelines

Task orchestration, dependencies, and parallel execution strategies.

## Pipeline Configuration

Define tasks in `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Task Dependencies

### Topological Dependencies (^)

`^` means "run this task in dependencies first":

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

Example flow:
```
packages/ui (dependency)
  ↓ builds first
apps/web (depends on @repo/ui)
  ↓ builds second
```

### Internal Dependencies

Run tasks in same package first:

```json
{
  "pipeline": {
    "deploy": {
      "dependsOn": ["build", "test"]
    }
  }
}
```

Execution order in same package:
1. Run `build`
2. Run `test`
3. Run `deploy`

### Combined Dependencies

Mix topological and internal:

```json
{
  "pipeline": {
    "test": {
      "dependsOn": ["^build", "lint"]
    }
  }
}
```

Execution order:
1. Build all dependencies (`^build`)
2. Lint current package (`lint`)
3. Run tests (`test`)

## Task Configuration Options

### outputs

Define what gets cached:

```json
{
  "build": {
    "outputs": [
      "dist/**",           // All files in dist
      ".next/**",          // Next.js build
      "!.next/cache/**",   // Exclude Next.js cache
      "build/**",          // Build directory
      "public/dist/**"     // Public assets
    ]
  }
}
```

### cache

Enable/disable caching:

```json
{
  "dev": {
    "cache": false        // Don't cache dev server
  },
  "build": {
    "cache": true         // Cache build (default)
  }
}
```

### persistent

Keep task running (for dev servers):

```json
{
  "dev": {
    "cache": false,
    "persistent": true    // Don't kill after completion
  }
}
```

### env

Environment variables affecting output:

```json
{
  "build": {
    "env": [
      "NODE_ENV",
      "NEXT_PUBLIC_API_URL",
      "DATABASE_URL"
    ]
  }
}
```

### passThroughEnv

Pass env vars without affecting cache:

```json
{
  "build": {
    "passThroughEnv": [
      "DEBUG",            // Pass through but don't invalidate cache
      "LOG_LEVEL"
    ]
  }
}
```

### inputs

Override default input detection:

```json
{
  "build": {
    "inputs": [
      "src/**/*.ts",
      "!src/**/*.test.ts", // Exclude test files
      "package.json"
    ]
  }
}
```

### outputMode

Control output display:

```json
{
  "build": {
    "outputMode": "full"        // Show all output
  },
  "dev": {
    "outputMode": "hash-only"   // Show cache hash only
  },
  "test": {
    "outputMode": "new-only"    // Show new output only
  },
  "lint": {
    "outputMode": "errors-only" // Show errors only
  }
}
```

## Running Tasks

### Basic Execution

```bash
# Run build in all packages
turbo run build

# Run multiple tasks
turbo run build test lint

# Run with specific package manager
pnpm turbo run build
```

### Filtering

Run tasks in specific packages:

```bash
# Single package
turbo run build --filter=web
turbo run build --filter=@repo/ui

# Multiple packages
turbo run build --filter=web --filter=api

# All apps
turbo run build --filter='./apps/*'

# Pattern matching
turbo run test --filter='*-api'
```

### Dependency Filtering

```bash
# Package and its dependencies
turbo run build --filter='...web'

# Package's dependencies only (exclude package itself)
turbo run build --filter='...^web'

# Package and its dependents
turbo run test --filter='ui...'

# Package's dependents only
turbo run test --filter='^ui...'
```

### Git-Based Filtering

Run only on changed packages:

```bash
# Changed since main branch
turbo run build --filter='[main]'

# Changed since HEAD~1
turbo run build --filter='[HEAD~1]'

# Changed in working directory
turbo run test --filter='...[HEAD]'

# Package and dependencies, only if changed
turbo run build --filter='...[origin/main]'
```

## Concurrency Control

### Parallel Execution (Default)

Turborepo runs tasks in parallel when safe:

```bash
# Run with default parallelism
turbo run build
```

### Limit Concurrency

```bash
# Max 3 tasks at once
turbo run build --concurrency=3

# 50% of CPU cores
turbo run build --concurrency=50%

# No parallelism (sequential)
turbo run build --concurrency=1
```

### Continue on Error

```bash
# Don't stop on first error
turbo run test --continue
```

## Task Execution Order

Example monorepo:
```
apps/
├── web (depends on @repo/ui, @repo/utils)
└── docs (depends on @repo/ui)
packages/
├── ui (depends on @repo/utils)
└── utils (no dependencies)
```

With config:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

Execution order for `turbo run build`:
1. **Wave 1** (parallel): `@repo/utils` (no dependencies)
2. **Wave 2** (parallel): `@repo/ui` (depends on utils)
3. **Wave 3** (parallel): `web` and `docs` (both depend on ui)

## Complex Pipeline Examples

### Full-Stack Application

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint", "typecheck"]
    }
  }
}
```

### Monorepo with Code Generation

```json
{
  "pipeline": {
    "generate": {
      "cache": false,
      "outputs": ["src/generated/**"]
    },
    "build": {
      "dependsOn": ["^build", "generate"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["generate"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Database-Dependent Pipeline

```json
{
  "pipeline": {
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "build": {
      "dependsOn": ["^build", "db:generate"],
      "outputs": ["dist/**"]
    },
    "test:unit": {
      "dependsOn": ["build"]
    },
    "test:integration": {
      "dependsOn": ["db:migrate"],
      "cache": false
    }
  }
}
```

## Dry Run

Preview execution without running:

```bash
# See what would run
turbo run build --dry-run

# JSON output for scripts
turbo run build --dry-run=json

# Show full task graph
turbo run build --graph
```

## Force Execution

Ignore cache and run tasks:

```bash
# Force rebuild everything
turbo run build --force

# Force specific package
turbo run build --filter=web --force
```

## Output Control

```bash
# Show only errors
turbo run build --output-logs=errors-only

# Show new logs only
turbo run build --output-logs=new-only

# Show cache hash only
turbo run build --output-logs=hash-only

# Show full output
turbo run build --output-logs=full
```

## Best Practices

1. **Use topological dependencies** - `^build` ensures correct build order
2. **Cache build outputs** - Define `outputs` for faster rebuilds
3. **Disable cache for dev** - Set `cache: false` for dev servers
4. **Mark persistent tasks** - Use `persistent: true` for long-running tasks
5. **Filter strategically** - Use filters to run only affected tasks
6. **Control concurrency** - Limit parallelism for resource-intensive tasks
7. **Configure env vars** - Include vars that affect output in `env`
8. **Use dry-run** - Preview execution plan before running
9. **Continue on error in CI** - Use `--continue` to see all errors
10. **Leverage git filtering** - Run only on changed packages in CI

## Common Patterns

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - run: turbo run build test lint --filter='...[origin/main]'
```

Only build/test/lint changed packages and their dependents.

### Development Workflow

```bash
# Start all dev servers
turbo run dev

# Start specific app with dependencies
turbo run dev --filter=web...
```

### Pre-commit Hook

```json
// package.json
{
  "scripts": {
    "pre-commit": "turbo run lint test --filter='...[HEAD]'"
  }
}
```

Only lint/test changed packages.

### Deployment

```bash
# Build and test specific app
turbo run build test --filter=web...

# Deploy if successful
turbo run deploy --filter=web
```

Build app and its dependencies, then deploy.
