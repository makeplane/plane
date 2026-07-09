# Configuration

## Wrangler Setup

```jsonc
{
  "name": "my-agents-app",
  "durable_objects": {
    "bindings": [
      {"name": "MyAgent", "class_name": "MyAgent"}
    ]
  },
  "migrations": [
    {"tag": "v1", "new_sqlite_classes": ["MyAgent"]}
  ],
  "ai": {
    "binding": "AI"
  }
}
```

## Environment Bindings

**Type-safe pattern:**

```typescript
interface Env {
  AI?: Ai;                              // Workers AI
  MyAgent?: DurableObjectNamespace<MyAgent>;
  ChatAgent?: DurableObjectNamespace<ChatAgent>;
  DB?: D1Database;                      // D1 database
  KV?: KVNamespace;                     // KV storage
  R2?: R2Bucket;                        // R2 bucket
  OPENAI_API_KEY?: string;              // Secrets
  GITHUB_CLIENT_ID?: string;            // MCP OAuth credentials
  GITHUB_CLIENT_SECRET?: string;
  QUEUE?: Queue;                        // Queues
}
```

**Best practice:** Define all DO bindings in Env interface for type safety.

## Deployment

```bash
# Local dev
npx wrangler dev

# Deploy production
npx wrangler deploy

# Set secrets
npx wrangler secret put OPENAI_API_KEY
```

## Agent Routing

**Recommended: Use route helpers**

```typescript
import { routeAgentRequest } from "agents";

export default {
  fetch(request: Request, env: Env) {
    return routeAgentRequest(request, env);
  }
}
```

Helper routes requests to agents automatically based on URL patterns.

**Manual routing (advanced):**

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    
    // Named ID (deterministic)
    const id = env.MyAgent.idFromName("user-123");
    
    // Random ID (from URL param)
    // const id = env.MyAgent.idFromString(url.searchParams.get("id"));
    
    const stub = env.MyAgent.get(id);
    return stub.fetch(request);
  }
}
```

**Multi-agent setup:**

```typescript
import { routeAgentRequest } from "agents";

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    
    // Route by path
    if (url.pathname.startsWith("/chat")) {
      return routeAgentRequest(request, env, "ChatAgent");
    }
    if (url.pathname.startsWith("/task")) {
      return routeAgentRequest(request, env, "TaskAgent");
    }
    
    return new Response("Not found", { status: 404 });
  }
}
```

## Email Routing

**Code setup:**

```typescript
import { routeAgentEmail } from "agents";

export default {
  fetch: (req: Request, env: Env) => routeAgentRequest(req, env),
  email: (message: ForwardableEmailMessage, env: Env) => {
    return routeAgentEmail(message, env);
  }
}
```

**Dashboard setup:**

Configure email routing in Cloudflare dashboard:

```
Destination: Workers with Durable Objects
Worker: my-agents-app
```

Then handle in agent:

```typescript
export class EmailAgent extends Agent<Env> {
  async onEmail(email: AgentEmail) {
    const text = await email.text();
    // Process email
  }
}
```

## AI Gateway (Optional)

```typescript
// Enable caching/routing through AI Gateway
const response = await this.env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct",
  { prompt },
  {
    gateway: {
      id: "my-gateway-id",
      skipCache: false,
      cacheTtl: 3600
    }
  }
);
```

## MCP Configuration (Optional)

For exposing tools via Model Context Protocol:

```typescript
// wrangler.jsonc - Add MCP OAuth secrets
{
  "vars": {
    "MCP_SERVER_URL": "https://mcp.example.com"
  }
}

// Set secrets via CLI
// npx wrangler secret put GITHUB_CLIENT_ID
// npx wrangler secret put GITHUB_CLIENT_SECRET
```

Then register in agent code (see api.md MCP section).
