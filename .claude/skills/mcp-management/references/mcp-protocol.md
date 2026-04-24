# Model Context Protocol (MCP) Reference

## Protocol Overview

MCP is JSON-RPC 2.0 based protocol for AI-tool integration.

**Version**: 2025-03-26
**Foundation**: JSON-RPC 2.0
**Architecture**: Client-Host-Server

## Connection Lifecycle

1. **Initialize**: Client sends `initialize` request with capabilities
2. **Response**: Server responds with its capabilities
3. **Handshake**: Client sends `notifications/initialized`
4. **Active**: Bidirectional messaging
5. **Shutdown**: Close connections, cleanup

## Core Capabilities

### Tools (Executable Functions)

Tools are functions that servers expose for execution.

**List Tools**:
```json
{"method": "tools/list"}
```

**Call Tool**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {}
  }
}
```

### Prompts (Interaction Templates)

Prompts are reusable templates for LLM interactions.

**List Prompts**:
```json
{"method": "prompts/list"}
```

**Get Prompt**:
```json
{
  "method": "prompts/get",
  "params": {
    "name": "prompt_name",
    "arguments": {}
  }
}
```

### Resources (Data Sources)

Resources expose read-only data to clients.

**List Resources**:
```json
{"method": "resources/list"}
```

**Read Resource**:
```json
{
  "method": "resources/read",
  "params": {"uri": "resource://path"}
}
```

## Transport Types

### stdio (Local)

Server runs as subprocess. Messages via stdin/stdout.

```typescript
const transport = new StdioClientTransport({
  command: 'node',
  args: ['server.js']
});
```

### HTTP+SSE (Remote)

POST for requests, GET for server events.

```typescript
const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:3000/mcp'
});
```

## Error Codes

- **-32700**: Parse error
- **-32600**: Invalid request
- **-32601**: Method not found
- **-32602**: Invalid params
- **-32603**: Internal error
- **-32002**: Resource not found (MCP-specific)

## Best Practices

1. **Progressive Disclosure**: Load tool definitions on-demand
2. **Context Efficiency**: Filter data before returning
3. **Security**: Validate inputs, sanitize outputs
4. **Resource Management**: Cleanup connections properly
5. **Error Handling**: Handle all error cases gracefully
