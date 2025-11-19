## Documentation Restructure Progress

Running log for the doc cleanup effort. Update this file whenever you touch docs so handoffs stay painless.

### 2025-11-19
- Created `docs/` hub without removing legacy root files (per request).
- Added curated READMEs for:
  - `getting-started/`
  - `development/`
  - `rebranding/`
  - `compliance/`
  - `operations/`
- Linked all new guides back to canonical sources (`README.md`, `CONTRIBUTING.md`, `REBRANDING.md`, etc.).
- Documented scanner commands and troubleshooting steps.

### Next Ideas
- Migrate older markdown files into the new folder once deletion/moves are allowed.
- Add architecture diagrams or ADRs under `docs/development/architecture/`.
- Automate doc linting (e.g., `markdownlint`) via CI.




