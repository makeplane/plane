## Rebranding Playbook

Central reference for safely rebranding Plane without breaking functionality. Pair this document with the deeper guides already in the repo.

### Core References
- [`REBRANDING.md`](../../REBRANDING.md) – Step-by-step plan spanning repo strategy, design tokens, telemetry, and AGPL obligations.
- [`REBRANDING-IMPLEMENTATION-SUMMARY.md`](../../REBRANDING-IMPLEMENTATION-SUMMARY.md) – What has already been implemented (scripts, stubs, tokens).
- `packages/tailwind-config/src/tokens.css` – Source of brand color variables.
- `packages/utils/src/brand-tokens.ts` – Runtime helpers to apply tokens dynamically.
- `packages/services/src/telemetry` – Toggleable telemetry adapters (PostHog vs `NoOpTelemetry`).

### Recommended Flow
1. **Run scanners**  
   - `scripts/generate-license-report.sh`  
   - `scripts/scan-assets.sh`  
   - `scripts/scan-secrets.sh`
2. **Update tokens and assets**  
   - Override CSS variables in `tokens.css`.  
   - Replace logo assets in `apps/*/app/assets/plane-logos/` and favicons.
3. **Disable telemetry if needed**  
   - Set `VITE_ENABLE_TELEMETRY=false` in environment files; rely on `NoOpTelemetry`.
4. **Abstract third-party dependencies**  
   - Use adapters in `packages/services` plus feature flags for risky integrations.
5. **Verify compliance**  
   - Keep `LICENSE.txt`, update `NOTICE.md`, and expose source download links per AGPL.

### Checklists
- UI visually updated (tokens + assets).
- Backend API contracts unchanged (confirm via regression tests).
- License + secret scans clean.
- `restructure-progress.md` updated with the latest status so teammates know what remains.




