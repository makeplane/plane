# Development Rules

**Principles:** YAGNI / KISS / DRY — always.

## Standards

- kebab-case file names (descriptive, self-documenting for LLM tools)
- Code files <200 lines, components <150 lines
- Follow codebase structure and code standards in `./docs`
- Real implementations only — no mocks, simulations, or fake data

## Tools

- `docs-seeker` skill for latest library/framework docs
- `gh` for GitHub, `psql` for Postgres debugging
- `ai-multimodal` for image/video/doc analysis
- `sequential-thinking` / `debug` skills for complex debugging

## Code Quality

- Functionality + readability over strict style enforcement
- No syntax errors — code must compile
- Try-catch error handling, cover security standards
- Use `code-reviewer` agent after every implementation

## Pre-commit

- Run linting before commit, tests before push
- Never commit secrets (.env, API keys, credentials)
- Conventional commit format, no AI references
- Never ignore failing tests

## Implementation

- Follow established architectural patterns
- Handle edge cases and error scenarios
- Update existing files directly — never create "enhanced" copies
