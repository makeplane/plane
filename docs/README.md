## Plane Documentation Hub

This `docs/` directory centralizes the most-used files that were previously scattered at the repository root. None of the original documents have been removed—each section below links back to the canonical source while providing additional context for teammates who prefer a curated table of contents.

### Directory Map
- `getting-started/` – Local development, environment diagnostics, and troubleshooting pointers that wrap the root `README.md`.
- `development/` – Contribution workflow, coding standards, and pull-request expectations from `CONTRIBUTING.md` plus supporting guides.
- `rebranding/` – Links to `REBRANDING.md`, `REBRANDING-IMPLEMENTATION-SUMMARY.md`, logo inventories, and brand-token utilities.
- `compliance/` – License/NOTICE references, AGPL obligations, scanning scripts, and reporting commands.
- `operations/` – Deployment targets (`deployments/`), Docker Compose usage, and infrastructure configuration.
- `restructure-progress.md` – Running log you can hand off to other teammates.

### How to Use
1. Start with `getting-started/README.md` the first time you set up Plane locally. It points to the canonical instructions and highlights the few environment gotchas we have already solved.
2. Keep `development/README.md` open while contributing—it references lint/test commands and explains how to work with the monorepo tooling (pnpm + Turbo).
3. When you need branding or license guidance, jump to `rebranding/` or `compliance/` for the latest references.
4. Update `restructure-progress.md` whenever you finish a doc-related task so the next contributor knows where things stand.

> **Note:** Because older docs still live at the root (per “no deletion” request), always treat the files inside `docs/` as curated mirrors with pointers—not replacements.




