# Requirements Specification: AI Planning Copilot for Plane

## Overview

We are building an AI-powered planning copilot integrated directly into this code base, an open-source project management tool. In the era of AI-driven development, the **specification becomes the code**. When AI agents handle the bulk of implementation, the quality of a feature depends entirely on the precision of the thinking that precedes it.

Instead of doing the thinking for the user, this copilot acts as an adversarial planning partner—interviewing, grilling, and pushing back against vague requirements until a rock-solid, defensible plan is formed.

---

## Existing Plane Core Features

- **Work Items:** Efficiently create and manage tasks with a robust rich-text editor supporting file uploads, sub-properties, and relations.
- **Cycles:** Track team momentum and progress effortlessly using burn-down charts and insightful tools.
- **Modules:** Simplify complex projects by dividing them into smaller, manageable sub-components.
- **Views:** Customize workflows with reusable, shareable, and dynamic filters.
- **Pages:** Capture and organize ideas using rich text, embedded files, and AI capabilities to convert notes into actionable items.
- **Analytics:** Access real-time insights, visualize trends, and clear project blockers.

---

## Core Product Capabilities

### 1. The Interview Engine

The agent thoroughly interrogates the user to uncover hidden edge cases, clarify ambiguous scope, and solidify the product logic before a single line of code is written.

### 2. Live Co-Authoring

Humans and AI agents collaborate simultaneously on a single live Document/Page. The interface updates in real-time as both parties contribute to the planning artifact.

---

## Hard Requirements (Codebase Conformance)

All new code must follow the existing structure and conventions of the codebase. These rules are mandatory. Any exception requires explicit approval.

### Backend (`apps/api`)

- **Placement:** new code goes in the existing Django apps. Views, serializers and URLs go under `plane/app` (`views/`, `serializers/`, `urls/`). Models go under `plane/db/models`. Celery tasks go under `plane/bgtasks`. Do not create a parallel project or a new top-level app unless unavoidable.
- **Views:** subclass the existing `BaseViewSet` or `BaseAPIView` from `plane/app/views/base.py`. Register routes through the existing `plane/app/urls` modules.
- **Models:** inherit `BaseModel` (audit fields and soft delete). Add Django migrations in the existing way. Scope data by workspace and project like the other models.
- **Permissions:** use `@allow_permission` with the `ROLE` enum or the existing permission classes. Do not add a separate authorisation mechanism.
- **Serializers, errors, logging:** use DRF serializers, the existing exception handling, and `log_exception` from `plane.utils.exception_logger`.
- **Config and LLM:** reuse `get_llm_config()` and the instance configuration for any future LLM settings. Do not add a second configuration path.
- **Tests:** follow `apps/api/tests/TESTING_GUIDE.md` (pytest, existing fixtures and markers).

### Frontend (`apps/web`, `packages/*`)

- **Placement:**
  - Components go in `apps/web/components/<feature>/`, with kebab-case files, role-based names (`root.tsx`, `modal.tsx`, `form.tsx`) and an `index.ts` barrel.
  - Routes go through `apps/web/app/routes/core.ts`.
  - MobX stores go in `apps/web/store/`, wrapped by a `hooks/store/use-*.ts` hook.
  - API clients go in `packages/services`.
  - Shared types and constants go in `packages/types` and `packages/constants`.
- **Component conventions:**
  - `observer(function Name(props: Props) {...})` with named exports.
  - The AGPL licence header on every file.
  - The existing import grouping.
  - `useTranslation()` for all user-facing text.
  - `setToast` for feedback.
- **Reuse before building:** use existing components and libraries first.
  - Primitives from `@makeplane/propel` (`Dialog`, `Menu`, `Combobox`, `Field`, `Input`, `TextArea`, `Switch`, `Collapsible`, `Tabs`, `Tooltip`, `Banner`, `Button` and others).
  - Composites from `@plane/blocks` through subpath imports (`toast`, `empty-state`, `skeleton` and others).
  - Existing editor, dropdown and issue-picker components where applicable.
  - A new component or third-party dependency is allowed only if nothing existing fits, and the reason must be documented.
- **Styling:** use Tailwind with the existing semantic tokens (`bg-surface-1`, `text-primary`, `border-subtle` and so on), `cn()` from `@plane/utils`, and the existing scrollbar utilities. No hard-coded colours, no new CSS framework.
- **Tooling:** new code must pass `pnpm check` (format, lint and types) and follow `AGENTS.md` (`catalog:` and `workspace:*` dependencies, strict TypeScript).

---

## Functional Requirements

### 1. Interface & The Chat Experience

- **Contextual Integration:** The chat workspace must live side-by-side with the active Page or ticket inside Plane, not as a detached application window.
- **Streaming & Simulation:** Support two-way streaming communication. Mock backend request/response I/O operations to simulate realistic chat flow and system states during evaluation.
- **Conversational Cleanliness:** To ensure long interviews remain highly readable, answered widgets must automatically collapse into a compact summary of their result, preventing the interface from turning into a wall of endless scrolling.

### 2. The Widget System

- **Structured Tool Calls:** The agent communicates via structured tool calls rather than plain text alone.
- **Visual State Lifecycle:** Every tool execution must explicitly display its current state: `Running`, `Done`, or `Failed`.
- **Data Flow Integrity:** UI controls report data back to the backend asynchronously as structured data. UI controls are strictly presentational and must never modify application state directly without backend verification.

---

## Tooling & Control Specifications

The backend dynamically defines the tool payloads, and the frontend dynamically renders them using the following custom controls:

| Tool Name        | Purpose & Functional Requirements                                                                                                                                                          | Supported Input Types / Behavior                                                                                                   |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `ask_user`       | Generalized dynamic form rendered from a backend-defined schema. Can hold one or multiple questions. Questions can be mandatory, optional, or bypassed with an explicit "not sure" choice. | Short text, long text, dropdown, multi-select, yes/no, number, date, ticket picker, file picker.                                   |
| `search_tickets` | Searches existing Plane workspace issues.                                                                                                                                                  | Displays active search queries, real-time results streaming in, and the specific tickets selected by the agent.                    |
| `propose_edit`   | Suggests changes to the main Page/ticket content.                                                                                                                                          | Rendered as a visual code/text diff. Users must be able to accept or reject changes granularly (in parts).                         |
| `draft_tickets`  | Breaks down the completed plan into actionable implementation tickets.                                                                                                                     | Displays an editable preview of all proposed tickets before they are committed and created in the system.                          |
| `remember`       | Commits critical contextual facts to the agent's long-term session memory.                                                                                                                 | Visually reveals what was memorized; allows the user to manually edit or delete the memory object.                                 |
| `web_search`     | Queries external web sources for research, documentation, or competitive technical references.                                                                                             | Displays active queries, loading sources, and explicitly maps out text-level citations for claims generated from specific sources. |

---

## Decisions (Resolved Open Questions)

### 1. Transport

- **Server → client:** Server-Sent Events (SSE) stream from the Django API.
- **Client → server:** Plain HTTP `POST` for user messages and widget responses.

### 2. Mock backend

- The mocked agent lives in the Django backend (`apps/api/plane/app`) as a real endpoint that streams scripted events.
- The frontend talks to the final API contract, so a real LLM can replace the mock later without frontend changes.

### 3. Real vs mocked tools

| Tool             | Behavior                                                                                  |
| :--------------- | :---------------------------------------------------------------------------------------- |
| `search_tickets` | **Real.** Queries actual workspace issues.                                                |
| `draft_tickets`  | **Real.** Creates actual work items when the user commits the previewed drafts.           |
| `ask_user`       | Mocked (scripted questions).                                                              |
| `propose_edit`   | Mocked (scripted proposals); accepted changes are applied to the real document (see 7).   |
| `remember`       | Mocked agent emits the calls; memory objects are persisted in the DB per session (see 4). |
| `web_search`     | Mocked (canned queries, sources and citations).                                           |

### 4. Memory (`remember`)

- Scope: per chat session.
- Stored in the database so it survives a page reload.
- Users can edit or delete individual memory objects.

### 5. Tool-call protocol

Custom event-based JSON over SSE. Every tool call has an `id` and a `status` of `running`, `done` or `failed`.

| Event              | Payload                                                                    |
| :----------------- | :------------------------------------------------------------------------- |
| `message_delta`    | Streamed assistant text chunk.                                             |
| `tool_call_start`  | `{ id, name, args }`                                                       |
| `tool_call_update` | `{ id, status, result? }` (for example streaming `search_tickets` results) |
| `tool_call_end`    | `{ id, status, result? }`                                                  |

- Widget responses are sent with `POST` as `{ tool_call_id, data }`, where `data` is structured and validated by the backend.
- The UI only reflects state confirmed by the backend, as required in "Data Flow Integrity".

### 6. `propose_edit` granularity

- Accept or reject per hunk (contiguous changed block).
- Hunks are independent. The final content is built from the accepted hunks only.

### 7. AI presence in the editor

- No AI cursor or presence indicator.
- Accepted edits are applied by the backend into the live document through the live server, so the user sees them appear in the editor in real time.

### 8. Scope of the first delivery

- Chat panel with streaming, all six tools (`ask_user`, `search_tickets`, `propose_edit`, `draft_tickets`, `remember`, `web_search`), the `Running`/`Done`/`Failed` lifecycle and collapse of answered widgets.
- The agent itself is mocked. No real LLM integration.

### 9. Permissions, i18n and surfaces

- **Permissions:** Reuse existing workspace and project roles. Only Admin and Member roles can use the copilot. Guests cannot.
- **i18n:** All UI strings use `@plane/i18n` keys (English first).
- **Surfaces:** Supported on both Pages and work items from the start, docked beside the content.

---

## Clarifications (Second Review)

### 10. Chat history and sessions

- The full transcript (messages, tool calls, widget results) is persisted per session and can be reloaded and resumed.
- There is one session per Page or work item.

### 11. Mocked agent behavior

- A single deterministic script drives the conversation.
- The script exercises all six tools in a fixed order and includes at least one `Failed` tool call.

### 12. Stale proposals

- If the Page or work item changes after a `propose_edit` was issued, the proposal is marked stale and accept is blocked.
- The backend verifies this. The agent must issue a new proposal.

### 13. `draft_tickets` preview

- Editable fields: title, description and priority.
- Tickets are created in the current project, only after the user commits the preview.

### 14. `ask_user` file picker

- Uses the existing Plane asset upload API (presigned S3 flow). Files are really uploaded.

### 15. Answered widgets

- Answered widgets collapse into a summary, can be expanded, and can be edited and re-submitted.
- The backend re-verifies every resubmission.

### 16. Panel behavior

- Resizable side panel, collapsible with a toggle button.
- Web app (`apps/web`) only. Not added to admin or space.
- No feature flag or instance setting.

### 17. Stop and retry

- Users can stop a streaming reply.
- Users can retry a `Failed` tool call.

### 18. Testing

- Backend unit tests (pytest) for endpoints and tool handlers.
- Frontend unit tests (Vitest) for the widgets.

---

## What We Need to Implement for the Copilot

### Existing LLM integration (findings)

The API already has a basic LLM integration in `apps/api/plane/app/views/external/base.py`, using the `openai==1.63.2` SDK.

- **Endpoints:**
  - `POST /api/workspaces/<slug>/projects/<project_id>/ai-assistant/` (`GPTIntegrationEndpoint`)
  - `POST /api/workspaces/<slug>/ai-assistant/` (`WorkspaceGPTIntegrationEndpoint`)
  - Both require the Admin or Member role.
- **Configuration:** `LLM_API_KEY`, `LLM_PROVIDER` (default `openai`) and `LLM_MODEL`, read from env vars or the instance configuration (editable in the admin app's AI page). `GPT_ENGINE` is deprecated. The instance endpoint returns `has_llm_configured`.
- **Provider registry:** `OpenAIProvider`, `AnthropicProvider` and `GeminiProvider`, each with a model allowlist.
- **Frontend client:** `packages/services/src/ai/ai.service.ts`.

**Limitations:**

- Only OpenAI works in practice. `get_llm_response` always builds `OpenAI(api_key=...)` with no custom `base_url`.
- One-shot completion only: a single user message (`task + "\n" + prompt`) and a text reply. No system prompt, message history, streaming or tool calling.
- JSON responses only, no SSE.
- The model allowlists are outdated, and unlisted models are rejected.
- No agent loop, session or memory storage, or web search anywhere in the API.

### Required for the first delivery (mocked agent)

The existing LLM integration is not on the critical path, since the agent is a scripted mock (see decision 8). These parts must be built:

- **Backend (`apps/api/plane/app`):**
  - SSE streaming endpoint and the `POST` endpoint for widget responses (decisions 1 and 5).
  - Tool-call event protocol and the scripted agent (decisions 5 and 11).
  - Models for sessions, messages and memory objects (decisions 4 and 10).
  - Real `search_tickets` and `draft_tickets` handlers (decision 3).
  - `propose_edit` application through the live server, with stale-proposal checks (decisions 7 and 12).
  - Permission checks with the existing `allow_permission` roles (decision 9).
- **Frontend (`apps/web`):**
  - Resizable, collapsible chat panel on Pages and work items (decisions 9 and 16).
  - Widgets for all six tools with the `Running`/`Done`/`Failed` lifecycle, collapse of answered widgets, stop and retry.
  - Services in `@plane/services`, MobX store, i18n keys and Vitest tests.

### Required later (swapping the mock for a real LLM)

Extend the existing integration:

- Add streaming and tool calling (OpenAI SDK `stream=True` and `tools`).
- Add a system prompt and message history.
- Add native Anthropic and Gemini clients, or an OpenAI-compatible `base_url`, so the provider setting works.
- Refresh the model lists.
- Reuse `get_llm_config()` for the key, provider and model, since the admin UI already manages them.
