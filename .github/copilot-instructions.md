See the root `AGENTS.md` for comprehensive project instructions including tech stack, monorepo structure, commands, and architecture.

Each app and package has its own `AGENTS.md` with module-specific context.

## Quick Reference

- **Package manager**: pnpm (never use npm or yarn)
- **Build**: Turbo (`turbo.json`)
- **Lint/types**: `pnpm check` from root
- **Auto-fix**: `pnpm fix` from root
- **Frontend**: React 18, React Router 7, TypeScript, MobX, Tailwind CSS
- **Backend**: Django, DRF, Celery, PostgreSQL, Redis
- **Code style**: camelCase for variables/functions, PascalCase for components/types
- **TypeScript**: Strict mode, `workspace:*` for internal packages, `catalog:` for external deps
- **Python**: Ruff for linting/formatting, line length 120
- **Formatting**: Prettier with Tailwind plugin
- **Linting**: ESLint 9 with typed linting
