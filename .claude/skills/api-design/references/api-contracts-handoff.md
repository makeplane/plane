## API Contracts & Handoff Documentation

Two sides of the same conversation between backend and frontend teams — use whichever direction matches where you are in the workflow, or both across a feature's lifecycle.

### Backend → Frontend: API handoff docs

After backend API work is complete (endpoints, DTOs, validation, business logic), produce a structured handoff document so frontend (or their AI) can build the integration without back-and-forth. Save to `<harness-config-dir>/docs/ai/<feature-name>/api-handoff.md` (detect the harness config dir — check which of `.claude/`, `.dsh/`, `.agents/`, `.gemini/` exists — and use it), incrementing an iteration suffix (`-v2`, `-v3`, …) on rerun after feedback. For simple CRUD with obvious validation, skip the full template — just the endpoint, method, and example request/response JSON.

Document structure: Business Context (problem, users, domain terms) → Endpoints (method/path, purpose, auth, request/response shapes, error codes, edge-case notes — repeat per endpoint) → Data Models/DTOs (as TS interfaces: types, nullability, enums) → Enums & Constants (value/meaning/display-label table) → Validation Rules (for frontend UX mirroring) → Business Logic & Edge Cases (non-obvious behaviors, e.g. "can only submit once per day") → Integration Notes (recommended flow, optimistic-UI safety, caching, real-time/websocket behavior) → Test Scenarios (happy path, validation error, not found, permission denied) → Open Questions/TODOs.

Rules: no backend implementation details (file paths, class names, internal services) unless directly relevant to integration; real example payloads, not placeholders; surface non-obvious behavior explicitly rather than assuming frontend will infer it.

### Frontend → Backend: requirements, not implementation

Before backend designs an endpoint, frontend documents *what data and actions* a screen needs — not *how* the API should be shaped. Save to `<harness-config-dir>/docs/ai/<feature-name>/backend-requirements.md` (detect the harness config dir — check which of `.claude/`, `.dsh/`, `.agents/`, `.gemini/` exists — and use it).

Split of ownership: frontend owns what data is needed, what actions exist, UI states, user-facing validation, display requirements. Backend owns data structure, endpoint design, field names/types, API conventions, performance/caching.

Document structure: Context → per Screen/Component (purpose, data needed to display — described, not as field names, plus relationships; actions → expected outcomes; states to handle: empty/loading/error/special; business rules affecting UI) → Uncertainties (business rules not understood, edge cases unsure how to handle) → Questions for Backend (open, inviting pushback) → Discussion Log (updated as backend responds).

Principle: describe the need ("I need to show a list of contracts, each with title/status/created date, filterable by status"), don't prescribe the shape ("GET /api/contracts returning id/title/status/created_at"). This keeps the contract negotiation collaborative — backend proposes the solution, frontend describes the problem — and the two directions above form the full round-trip: requirements in before implementation, handoff docs out after.
