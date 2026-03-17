# Building Agents in Plane Silo

This guide covers everything needed to add a new agent to Plane's silo integration system. The framework handles credential management, OAuth token refresh, webhook queuing, and Plane API interaction — you only need to implement the agent-specific logic.

## Architecture Overview

```
User @mentions agent on a Plane issue
  → Plane sends webhook to POST /api/agents/webhook/:agentKey
  → AgentController validates & queues via RabbitMQ
  → AgentWebhookWorker picks up job, calls agent.handleWebhook()
  → BaseAgent resolves credentials, refreshes OAuth token, creates PlaneClient
  → YourAgent.processAgentRun(context) — YOUR CODE RUNS HERE
  → Agent posts activities back to Plane via planeClient.agentRuns.activities.create()

External service completes work and calls back:
  → POST /api/agents/<name>/callback (your controller)
  → Verify signature, look up session, post result to Plane
```

## Step-by-Step: Adding a New Agent

### 1. Add Integration Key

**File:** `packages/types/src/etl/integration.ts`

```typescript
export enum E_INTEGRATION_KEYS {
  // ... existing keys ...
  MY_AGENT = "MY_AGENT",
}
```

### 2. Add Environment Variables (if needed)

**File:** `apps/silo/src/env.ts`

Add to the Zod schema. Use `.optional()` for variables that aren't required at startup.

```typescript
MY_AGENT_WEBHOOK_SECRET: z.string().optional(),
```

### 3. Create Agent Directory

```
src/agents/my-agent/
├── agent.ts              # Main agent class (extends BaseAgent)
├── my-agent-api.ts       # HTTP client for external service API
├── helpers.ts            # Pure utility functions
├── types.ts              # Agent-specific TypeScript types
└── controllers/
    └── my-agent.controller.ts  # Settings + callback endpoints
```

### 4. Define Types (`types.ts`)

Define interfaces for:

- **API request/response types** — what you send to and receive from the external service
- **Webhook payload** — what the external service POSTs back to your callback
- **Session entity data** — what you store in `workspace_entity_connections` for correlation

```typescript
// What you send to launch a task on the external service
export interface MyAgentLaunchParams {
  /* ... */
}

// What the external service returns
export interface MyAgentResponse {
  /* ... */
}

// What the external service POSTs to your callback URL
export interface MyAgentWebhookPayload {
  /* ... */
}

// What you store in entity_data for session tracking
export interface MyAgentSessionEntityData {
  external_session_id: string;
  agent_run_id: string;
  workspace_slug: string;
  project_id: string;
  issue_id: string;
  status: string;
}
```

### 5. Build API Client (`my-agent-api.ts`)

A plain axios-based HTTP client for the external service.

```typescript
import axios, { type AxiosInstance } from "axios";

export class MyAgentApiClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: "https://api.myservice.com",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  async launchTask(params: MyAgentLaunchParams): Promise<MyAgentResponse> {
    const { data } = await this.client.post("/v1/tasks", params);
    return data;
  }

  async getTask(id: string): Promise<MyAgentResponse> {
    const { data } = await this.client.get(`/v1/tasks/${id}`);
    return data;
  }
}
```

### 6. Write Helpers (`helpers.ts`)

Pure functions for prompt building, webhook URL construction, and signature verification.

```typescript
import crypto from "crypto";
import { env } from "@/env";

/**
 * Strip HTML tags from Plane comment body to get plain text for external prompts.
 * Plane sends user prompts as HTML from the rich text editor.
 */
export function buildPrompt(htmlBody: string): string {
  return htmlBody.replace(/<[^>]*>/g, "").trim();
}

/**
 * Build the callback URL the external service should POST to when done.
 * Pass correlation IDs as query params so the callback can look up the session.
 */
export function getWebhookCallbackUrl(params: { workspaceConnectionId: string; workspaceId: string }): string {
  const basePath = env.SILO_BASE_PATH || "";
  const baseUrl = `${env.SILO_API_BASE_URL}${basePath}/api/agents/my-agent/callback`;
  const query = new URLSearchParams({
    wc_id: params.workspaceConnectionId,
    ws_id: params.workspaceId,
  });
  return `${baseUrl}?${query.toString()}`;
}

/**
 * Verify webhook signature from the external service.
 * Adapt the algorithm to match what the service sends.
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
```

### 7. Implement the Agent (`agent.ts`)

Extend `BaseAgent` and implement `processAgentRun`. The framework calls this with a fully populated `AgentRunContext`.

```typescript
import { logger } from "@plane/logger";
import type { AgentConfig, AgentRunContext } from "@/agents/core";
import { BaseAgent } from "@/agents/core";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { MyAgentApiClient } from "./my-agent-api";
import { buildPrompt, getWebhookCallbackUrl } from "./helpers";
import type { MyAgentSessionEntityData } from "./types";

export class MyAgent extends BaseAgent {
  readonly config: AgentConfig = {
    key: "my-agent", // route key — matches :agentKey in webhook URL
    integrationKey: E_INTEGRATION_KEYS.MY_AGENT, // used for credential/connection lookups
  };

  async processAgentRun(context: AgentRunContext): Promise<void> {
    const {
      planeClient,
      agentRunId,
      workspaceSlug,
      workspaceId,
      projectId,
      issueId,
      userPrompt,
      credential,
      workspaceConnectionId,
    } = context;

    // 1. Get API key from credential
    const apiKey = credential.source_access_token;
    if (!apiKey) {
      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "response",
        content: { type: "response", body: "API key not configured." },
      });
      return;
    }

    const client = new MyAgentApiClient(apiKey);
    const prompt = buildPrompt(userPrompt);

    // 2. Post a "thinking" activity
    await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
      type: "thought",
      content: { type: "thought", body: "Launching task..." },
    });

    // 3. Call the external service
    const result = await client.launchTask({
      prompt: { text: prompt },
      webhook: {
        url: getWebhookCallbackUrl({ workspaceConnectionId, workspaceId }),
        secret: process.env.MY_AGENT_WEBHOOK_SECRET,
      },
    });

    // 4. Store session mapping for callback correlation
    await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
      workspace_id: workspaceId,
      workspace_connection_id: workspaceConnectionId,
      entity_id: result.id, // external service's session/task ID
      entity_type: "MY_AGENT_SESSION", // namespace string for entity connections
      entity_data: {
        external_session_id: result.id,
        agent_run_id: agentRunId,
        workspace_slug: workspaceSlug,
        project_id: projectId,
        issue_id: issueId,
        status: result.status,
      } satisfies MyAgentSessionEntityData,
    });

    // 5. Confirm to the user
    await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
      type: "response",
      content: { type: "response", body: "Task launched. I'll update you when it's done." },
    });
  }
}
```

### 8. Implement the Controller (`controllers/my-agent.controller.ts`)

Two typical endpoints: one for saving settings, one for receiving callbacks.

```typescript
import type { Request, Response } from "express";
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { getPlaneClientV2 } from "@/helpers/plane-api-client-v2";
import { responseHandler } from "@/helpers/response-handler";
import { useValidateUserAuthentication } from "@/lib/decorators";
import { planeOAuthService } from "@/services/oauth/auth";
import { verifyWebhookSignature } from "../helpers";
import type { MyAgentSessionEntityData, MyAgentWebhookPayload } from "../types";

@Controller("/api/agents/my-agent")
export class MyAgentController {
  /**
   * Save API key and configuration for a workspace.
   */
  @Post("/settings/:workspaceId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async saveSettings(req: Request, res: Response) {
    // 1. Validate request body
    // 2. Look up workspace connection via integrationConnectionHelper.getWorkspaceConnection()
    // 3. Update credential with API key via integrationConnectionHelper.updateWorkspaceCredential()
    // 4. Update connection_data via integrationConnectionHelper.createOrUpdateWorkspaceConnection()
    // 5. Return success
  }

  /**
   * Callback from the external service when a task completes.
   * Query params: wc_id (workspace connection ID), ws_id (workspace ID)
   */
  @Post("/callback")
  async handleCallback(req: Request, res: Response) {
    // 1. Verify webhook signature
    const signature = req.headers["x-webhook-signature"] as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const rawBody = (req as any).rawBody as string | undefined;

    // 2. Read correlation params: req.query.wc_id, req.query.ws_id

    // 3. Look up entity connection:
    //    integrationConnectionHelper.getWorkspaceEntityConnection({
    //      workspace_connection_id: wcId, entity_id: externalTaskId
    //    })

    // 4. Get workspace connection + credential → refresh OAuth token → create PlaneClient

    // 5. Post result as activity:
    //    planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
    //      type: "response",
    //      content: { type: "response", body: "<p>Result here (HTML)</p>" },
    //    })

    // 6. Update entity connection status:
    //    integrationConnectionHelper.updateWorkspaceEntityConnection({
    //      entity_connection_id, entity_data: { ...data, status: "FINISHED" }
    //    })

    return res.status(200).json({ message: "ok" });
  }
}
```

### 9. Register the Agent and Controller

**File:** `apps/silo/src/agents/index.ts`

```typescript
import { MyAgent } from "./my-agent/agent";

export function registerAgents(): void {
  // ... existing agents ...
  agentRegistry.register(new MyAgent());
}
```

**File:** `apps/silo/src/server.ts`

Add to the `CONTROLLERS.APPS` array:

```typescript
import { MyAgentController } from "./agents/my-agent/controllers/my-agent.controller";

// In CONTROLLERS.APPS:
AgentController,
CursorController,
MyAgentController,
```

No changes needed to workers — the existing `AgentWebhookWorker` dispatches to all registered agents via `agentRegistry.get(headers.type)`.

## Key Reference

### AgentRunContext (what `processAgentRun` receives)

| Field                   | Type                                  | Description                                                           |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| `planeClient`           | `PlaneClient`                         | Authenticated SDK client (token already refreshed)                    |
| `agentRunId`            | `string`                              | The Plane agent run ID                                                |
| `workspaceSlug`         | `string`                              | Workspace slug                                                        |
| `workspaceId`           | `string`                              | Workspace UUID                                                        |
| `projectId`             | `string`                              | Project UUID                                                          |
| `issueId`               | `string`                              | Issue UUID                                                            |
| `userPrompt`            | `string`                              | User's message (HTML from editor). Empty for `agent_run` type events. |
| `workspaceConnectionId` | `string`                              | Workspace connection UUID                                             |
| `credentialId`          | `string`                              | Credential UUID                                                       |
| `credential`            | `TWorkspaceCredential`                | Full credential object (contains `source_access_token`, etc.)         |
| `workspaceConnection`   | `TWorkspaceConnection`                | Full connection object (contains `connection_data`, etc.)             |
| `webhookType`           | `"agent_run" \| "agent_run_activity"` | Whether this is the initial @mention or a follow-up prompt            |

### Plane Activity Types

Activities are what the agent posts back to Plane. They appear in the conversation UI.

```typescript
planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
  type: "<activity_type>",
  content: { type: "<activity_type>", body: "<html_string>" },
});
```

| Type            | Purpose                                     | UI Rendering                                    |
| --------------- | ------------------------------------------- | ----------------------------------------------- |
| `"thought"`     | Agent's internal reasoning / status updates | Grouped together, collapsible                   |
| `"action"`      | Agent performed an action                   | Grouped together, collapsible                   |
| `"response"`    | Final response to the user                  | Rendered in LiteTextEditor (Tiptap/ProseMirror) |
| `"error"`       | Error message                               | Rendered in red text                            |
| `"elicitation"` | Agent asking user a question                | Rendered in LiteTextEditor                      |

**Important:** The `body` field for `response` and `elicitation` types is rendered as **HTML** in Plane's LiteTextEditor (Tiptap/ProseMirror). If your external service returns markdown, convert it to HTML before posting. Use the `marked` library and strip `\n` characters:

```typescript
import { marked } from "marked";

function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return html.replace(/\n/g, "");
}
```

`thought` and `action` types are grouped together in the UI and shown as collapsible work indicators. `prompt`, `response`, `elicitation`, and `error` are rendered individually.

### Credential Storage Pattern

Agents store their external service credentials in `workspace_credentials`:

| Field                 | Usage                                                 |
| --------------------- | ----------------------------------------------------- |
| `source_access_token` | External service API key (e.g., Cursor API key)       |
| `target_access_token` | Plane bot OAuth token (managed by PlaneOAuthStrategy) |

Configuration (like default repository, project mappings) goes in `workspace_connections.connection_data`:

```typescript
const data = workspaceConnection.connection_data as Record<string, unknown>;
// e.g., data.default_repository, data.default_ref
```

### Session Tracking with Entity Connections

Use `workspace_entity_connections` to map external service sessions to Plane agent runs:

```typescript
// Store session mapping
await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
  workspace_id: workspaceId,
  workspace_connection_id: workspaceConnectionId,
  entity_id: externalSessionId, // unique ID from external service
  entity_type: "MY_AGENT_SESSION", // namespace string (not an enum)
  entity_data: {
    /* your session data */
  },
});

// Look up session in callback
const entityConnection = await integrationConnectionHelper.getWorkspaceEntityConnection({
  workspace_connection_id: workspaceConnectionId,
  entity_id: externalSessionId,
});
const sessionData = entityConnection.entity_data as unknown as MyAgentSessionEntityData;
```

### Callback Correlation Pattern

Pass `workspaceConnectionId` and `workspaceId` as query params in the webhook URL you give to the external service. This lets the callback controller look up the right workspace connection without searching.

```typescript
// In agent.ts — when launching
const callbackUrl = getWebhookCallbackUrl({ workspaceConnectionId, workspaceId });
// → https://silo.example.com/api/agents/my-agent/callback?wc_id=xxx&ws_id=yyy

// In controller callback — when receiving
const wcId = req.query.wc_id as string;
const wsId = req.query.ws_id as string;
```

### Webhook Signature Verification

The callback controller should verify signatures using `req.rawBody` (set by silo's `setRawBodyOnRequest` middleware on the express JSON parser). Access it via:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
const rawBody = (req as any).rawBody as string | undefined;
```

### Follow-up Messages

When a user sends a follow-up message to a running agent session, `processAgentRun` is called again with `context.webhookType === "agent_run_activity"`. Use `context.agentRunId` to find the existing session in entity connections and decide whether to launch a new session or send a follow-up to the existing one.

### integrationConnectionHelper Methods

```typescript
// Workspace connections (agent ↔ workspace link)
getWorkspaceConnection({ workspace_id, connection_type }): Promise<TWorkspaceConnection | null>
createOrUpdateWorkspaceConnection({ workspace_id, connection_type, connection_id, connection_slug, connection_data, credential_id }): Promise<TWorkspaceConnection>
updateWorkspaceConnection({ workspace_connection_id, config }): Promise<TWorkspaceConnection>

// Entity connections (session tracking)
createOrUpdateWorkspaceEntityConnection({ workspace_id, workspace_connection_id, entity_id, entity_type, entity_data, project_id?, issue_id? }): Promise<TWorkspaceEntityConnection>
getWorkspaceEntityConnection({ workspace_connection_id, entity_id }): Promise<TWorkspaceEntityConnection | null>
getWorkspaceEntityConnections({ workspace_connection_id, entity_type? }): Promise<TWorkspaceEntityConnection[]>
updateWorkspaceEntityConnection({ entity_connection_id, entity_data?, config? }): Promise<TWorkspaceEntityConnection>

// Credentials
getWorkspaceCredential({ credential_id }): Promise<TWorkspaceCredential>
updateWorkspaceCredential({ credential_id, source_access_token? }): Promise<TWorkspaceCredential>
```

## Checklist for a New Agent

- [ ] Add key to `E_INTEGRATION_KEYS` enum in `packages/types/src/etl/integration.ts`
- [ ] Add env vars to `apps/silo/src/env.ts` (if needed)
- [ ] Create `agents/<name>/types.ts` — API types, webhook payload, session entity data
- [ ] Create `agents/<name>/<name>-api.ts` — HTTP client for external service
- [ ] Create `agents/<name>/helpers.ts` — prompt builder, callback URL, signature verification
- [ ] Create `agents/<name>/agent.ts` — extend `BaseAgent`, implement `processAgentRun`
- [ ] Create `agents/<name>/controllers/<name>.controller.ts` — settings + callback endpoints
- [ ] Register agent in `agents/index.ts` → `registerAgents()`
- [ ] Register controller in `server.ts` → `CONTROLLERS.APPS`
- [ ] Add copyright header to all new files (see root `CLAUDE.md`)
- [ ] Run `pnpm build` and `pnpm check:lint` to verify

## Reference: Cursor Agent (`agents/cursor/`)

The Cursor agent is the first concrete implementation and serves as the reference for this guide. It integrates with Cursor's Cloud Agent API to launch coding tasks against a GitHub repository and report back the PR when done.
