# Turborepo Setup & Configuration

Installation, workspace configuration, and project structure for monorepos.

## Installation

### Create New Monorepo

Using official starter:
```bash
npx create-turbo@latest my-monorepo
cd my-monorepo
```

Interactive prompts:
- Project name
- Package manager (npm, yarn, pnpm, bun)
- Example template

### Manual Installation

Install in existing project:
```bash
# npm
npm install turbo --save-dev

# yarn
yarn add turbo --dev

# pnpm
pnpm add turbo --save-dev

# bun
bun add turbo --dev
```

## Workspace Configuration

### Package Manager Setup

**pnpm (recommended):**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**npm/yarn:**
```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### Root Package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0"
  },
  "packageManager": "pnpm@8.0.0"
}
```

## Project Structure

### Recommended Directory Structure

```
my-monorepo/
├── apps/                    # Applications
│   ├── web/                # Next.js web app
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.js
│   ├── docs/               # Documentation site
│   │   ├── app/
│   │   └── package.json
│   └── api/                # Backend API
│       ├── src/
│       └── package.json
├── packages/               # Shared packages
│   ├── ui/                 # UI component library
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/             # Shared configs
│   │   ├── eslint/
│   │   └── typescript/
│   ├── utils/              # Utility functions
│   │   ├── src/
│   │   └── package.json
│   └── types/              # Shared TypeScript types
│       ├── src/
│       └── package.json
├── turbo.json              # Turborepo config
├── package.json            # Root package.json
├── pnpm-workspace.yaml     # Workspace config (pnpm)
└── .gitignore
```

## Application Package Setup

### Next.js App

```json
// apps/web/package.json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "*",
    "@repo/utils": "*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "@repo/eslint-config": "*",
    "typescript": "^5.0.0"
  }
}
```

### Backend API App

```json
// apps/api/package.json
{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts",
    "start": "node dist/index.js",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@repo/utils": "*",
    "@repo/types": "*",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "@types/express": "^4.17.0",
    "tsx": "^4.0.0",
    "tsup": "^8.0.0"
  }
}
```

## Shared Package Setup

### UI Component Library

```json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./button": {
      "types": "./dist/button.d.ts",
      "default": "./dist/button.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "react": "latest"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "typescript": "^5.0.0"
  }
}
```

```json
// packages/ui/tsconfig.json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "declarationDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Utility Library

```json
// packages/utils/package.json
{
  "name": "@repo/utils",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Shared Configuration Packages

### TypeScript Config Package

```
packages/typescript-config/
├── base.json
├── nextjs.json
├── react-library.json
└── package.json
```

```json
// packages/typescript-config/package.json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "main": "base.json",
  "files": [
    "base.json",
    "nextjs.json",
    "react-library.json"
  ]
}
```

```json
// packages/typescript-config/base.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "target": "ES2020",
    "module": "ESNext"
  },
  "exclude": ["node_modules"]
}
```

```json
// packages/typescript-config/nextjs.json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ESLint Config Package

```
packages/eslint-config/
├── library.js
├── next.js
└── package.json
```

```json
// packages/eslint-config/package.json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "main": "library.js",
  "files": ["library.js", "next.js"],
  "dependencies": {
    "eslint-config-next": "latest",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-react": "latest"
  }
}
```

```js
// packages/eslint-config/library.js
module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
  },
}
```

```js
// packages/eslint-config/next.js
module.exports = {
  extends: ['next', 'prettier'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
}
```

## Dependency Management

### Internal Dependencies

Use workspace protocol:

**pnpm:**
```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

**npm/yarn:**
```json
{
  "dependencies": {
    "@repo/ui": "*"
  }
}
```

### Version Syncing

Keep dependencies in sync across packages:

```json
// Root package.json
{
  "devDependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.0.0"
  }
}
```

Packages inherit from root or specify versions explicitly.

## Turbo.json Configuration

Basic configuration file:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local",
    "tsconfig.json"
  ],
  "globalEnv": [
    "NODE_ENV"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Environment Variables

### Global Environment Variables

```json
// turbo.json
{
  "globalEnv": [
    "NODE_ENV",
    "CI"
  ]
}
```

### Package-Specific Environment Variables

```json
{
  "pipeline": {
    "build": {
      "env": ["NEXT_PUBLIC_API_URL", "DATABASE_URL"],
      "passThroughEnv": ["CUSTOM_VAR"]
    }
  }
}
```

### .env Files

```
my-monorepo/
├── .env                    # Global env vars
├── .env.local             # Local overrides (gitignored)
├── apps/
│   └── web/
│       ├── .env           # App-specific
│       └── .env.local     # Local overrides
```

## Gitignore Configuration

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Turbo
.turbo

# Build outputs
dist/
.next/
out/
build/

# Environment
.env.local
.env.*.local

# Testing
coverage/

# Misc
.DS_Store
*.log
```

## NPM Scripts

Common scripts in root package.json:

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "typecheck": "turbo run typecheck"
  }
}
```

## Initialization Checklist

Setting up new Turborepo:

- [ ] Install Turborepo (create-turbo or manual)
- [ ] Configure workspace (pnpm-workspace.yaml or package.json)
- [ ] Create directory structure (apps/, packages/)
- [ ] Set up shared config packages (typescript-config, eslint-config)
- [ ] Create turbo.json with pipeline
- [ ] Configure gitignore
- [ ] Set up environment variables
- [ ] Define package dependencies
- [ ] Add root scripts
- [ ] Test build and dev commands
