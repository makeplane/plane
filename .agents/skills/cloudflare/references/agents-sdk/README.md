# Cloudflare Agents SDK

Cloudflare Agents SDK enables building AI-powered agents on Durable Objects with state, WebSockets, SQL, scheduling, and AI integration.

## Core Value
Build stateful, globally distributed AI agents with persistent memory, real-time connections, scheduled tasks, and async workflows.

## When to Use
- Persistent state + memory required
- Real-time WebSocket connections
- Long-running workflows (minutes/hours)
- Chat interfaces with AI models
- Scheduled/recurring tasks with state
- DB queries with agent state

## What Type of Agent?

| Use Case | Class | Key Features |
|----------|-------|--------------|
| AI chat interface | `AIChatAgent` | Auto-streaming, tools, message history, resumable |
| MCP tool provider | `Agent` + MCP | Expose tools to AI systems |
| Custom logic/routing | `Agent` | Full control, WebSockets, email, SQL |
| Real-time collaboration | `Agent` | WebSocket state, broadcasts |
| Email processing | `Agent` | `onEmail()` handler |

## Quick Start

**AI Chat Agent:**
```typescript
import { AIChatAgent } from "@cloudflare/ai-chat";
import { openai } from "@ai-sdk/openai";

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    return this.streamText({
      model: openai("gpt-4"),
      messages: this.messages,
      onFinish,
    });
  }
}
```

**Base Agent:**
```typescript
import { Agent } from "agents";

export class MyAgent extends Agent<Env> {
  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY)`;
  }
  
  async onRequest(request: Request) {
    return Response.json({ state: this.state });
  }
}
```

## Reading Order

| Task | Files to Read |
|------|---------------|
| Quick start | README only |
| Build chat agent | README → api.md (AIChatAgent) → patterns.md |
| Setup project | README → configuration.md |
| Add React frontend | README → api.md (Client Hooks) → patterns.md |
| Build MCP server | api.md (MCP) → patterns.md |
| Background tasks | api.md (Scheduling, Task Queue) → patterns.md |
| Debug issues | gotchas.md |

## Package Entry Points

| Import | Purpose |
|--------|---------|
| `agents` | Server-side Agent classes, lifecycle |
| `agents/react` | `useAgent()` hook for WebSocket connections |
| `agents/ai-react` | `useAgentChat()` hook for AI chat UIs |

## In This Reference
- [configuration.md](./configuration.md) - SDK setup, wrangler config, routing
- [api.md](./api.md) - Agent classes, lifecycle, client hooks
- [patterns.md](./patterns.md) - Common workflows, best practices
- [gotchas.md](./gotchas.md) - Common issues, limits

## See Also
- durable-objects - Agent infrastructure
- d1 - External database integration
- workers-ai - AI model integration
- vectorize - Vector search for RAG patterns