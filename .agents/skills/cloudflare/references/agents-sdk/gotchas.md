# Gotchas & Best Practices

## Common Errors

### "setState() not syncing"

**Cause:** Mutating state directly or not calling `setState()` after modifications  
**Solution:** Always use `setState()` with immutable updates:
```ts
// ❌ this.state.count++
// ✅ this.setState({...this.state, count: this.state.count + 1})
```

### "Message history grows unbounded (AIChatAgent)"

**Cause:** `this.messages` in `AIChatAgent` accumulates all messages indefinitely  
**Solution:** Manually trim old messages periodically:
```ts
export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    // Keep only last 50 messages
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50);
    }
    
    return this.streamText({ model: openai("gpt-4"), messages: this.messages, onFinish });
  }
}
```

### "SQL injection vulnerability"

**Cause:** Direct string interpolation in SQL queries
**Solution:** Use parameterized queries:
```ts
// ❌ this.sql`...WHERE id = '${userId}'`
// ✅ this.sql`...WHERE id = ${userId}`
```

### "WebSocket connection timeout"

**Cause:** Not calling `conn.accept()` in `onConnect`
**Solution:** Always accept connections:
```ts
async onConnect(conn: Connection, ctx: ConnectionContext) { conn.accept(); conn.setState({userId: "123"}); }
```

### "Schedule limit exceeded"

**Cause:** More than 1000 scheduled tasks per agent
**Solution:** Clean up old schedules and limit creation rate:
```ts
async checkSchedules() { if ((await this.getSchedules()).length > 800) console.warn("Near limit!"); }
```

### "AI Gateway unavailable"

**Cause:** AI service timeout or quota exceeded  
**Solution:** Add error handling and fallbacks:
```ts
try { 
  return await this.env.AI.run(model, {prompt}); 
} catch (e) { 
  console.error("AI error:", e);
  return {error: "Unavailable"}; 
}
```

### "@callable method returns undefined"

**Cause:** Method doesn't return JSON-serializable value, or has non-serializable types  
**Solution:** Ensure return values are plain objects/arrays/primitives:
```ts
// ❌ Returns class instance
@callable()
async getData() { return new Date(); }

// ✅ Returns serializable object
@callable()
async getData() { return { timestamp: Date.now() }; }
```

### "Resumable stream not resuming"

**Cause:** Stream ID must be deterministic for resumption to work  
**Solution:** Use AIChatAgent (automatic) or ensure consistent stream IDs:
```ts
// AIChatAgent handles this automatically
export class ChatAgent extends AIChatAgent<Env> {
  // Resumption works out of the box
}
```

### "MCP connection loss on hibernation"

**Cause:** MCP server connections don't survive hibernation  
**Solution:** Re-register servers in `onStart()` or check connection status:
```ts
onStart() {
  // Re-register MCP servers after hibernation
  await this.mcp.registerServer("github", { url: env.MCP_URL, auth: {...} });
}
```

### "Agent not found"

**Cause:** Durable Object binding missing or incorrect class name  
**Solution:** Verify DO binding in wrangler.jsonc and class name matches

## Rate Limits & Quotas

| Resource/Limit | Value | Notes |
|----------------|-------|-------|
| CPU per request | 30s (std), 300s (max) | Set in wrangler.jsonc |
| Memory per instance | 128MB | Shared with WebSockets |
| Storage per agent | 10GB | SQLite storage |
| Scheduled tasks | 1000 per agent | Monitor with `getSchedules()` |
| WebSocket connections | Unlimited | Within memory limits |
| SQL columns | 100 | Per table |
| SQL row size | 2MB | Key + value |
| WebSocket message | 32MiB | Max size |
| DO requests/sec | ~1000 | Per unique DO instance; rate limit if needed |
| AI Gateway (Workers AI) | Model-specific | Check dashboard for limits |
| MCP requests | Depends on server | Implement retry/backoff |

## Best Practices

### State Management
- Use immutable updates: `setState({...this.state, key: newValue})`
- Trim unbounded arrays (messages, logs) periodically
- Store large data in SQL, not state

### SQL Usage
- Create tables in `onStart()`, not `onRequest()`
- Use parameterized queries: `` sql`WHERE id = ${id}` `` (NOT `` sql`WHERE id = '${id}'` ``)
- Index frequently queried columns

### Scheduling
- Monitor schedule count: `await this.getSchedules()`
- Cancel completed tasks to stay under 1000 limit
- Use cron strings for recurring tasks

### WebSockets
- Always call `conn.accept()` in `onConnect()`
- Handle client disconnects gracefully
- Broadcast to `this.connections` efficiently

### AI Integration
- Use `AIChatAgent` for chat interfaces (auto-streaming, resumption)
- Trim message history to avoid token limits
- Handle AI errors with try/catch and fallbacks

### Production Deployment
- **Rate limiting:** Implement request throttling for high-traffic agents (>1000 req/s)
- **Monitoring:** Log critical errors, track schedule count, monitor storage usage
- **Graceful degradation:** Handle AI service outages with fallbacks
- **Message trimming:** Enforce max history length (e.g., 100 messages) in AIChatAgent
- **MCP reliability:** Re-register servers on hibernation, implement retry logic
