# MCP Management Skill

Intelligent management and execution of Model Context Protocol (MCP) servers.

## Overview

This skill enables Claude to discover, analyze, and execute MCP server capabilities without polluting the main context window. Perfect for context-efficient MCP integration using subagent-based architecture.

## Features

- **Multi-Server Management**: Connect to multiple MCP servers from single config
- **Intelligent Tool Discovery**: Analyze which tools are relevant for specific tasks
- **Progressive Disclosure**: Load only necessary tool definitions
- **Execution Engine**: Call MCP tools with proper parameter handling
- **Context Efficiency**: Delegate MCP operations to `mcp-manager` subagent

## Quick Start

### 1. Install Dependencies

```bash
cd .claude/skills/mcp-management/scripts
npm install
```

### 2. Configure MCP Servers

Create `.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

See `.claude/.mcp.json.example` for more examples.

### 3. Test Connection

```bash
cd .claude/skills/mcp-management/scripts
npx ts-node cli.ts list-tools
```

## Usage Patterns

### Pattern 1: Discover Available Tools

```bash
npx ts-node scripts/cli.ts list-tools
npx ts-node scripts/cli.ts list-prompts
npx ts-node scripts/cli.ts list-resources
```

### Pattern 2: LLM-Driven Tool Selection

The LLM reads `assets/tools.json` and intelligently selects tools. No separate analysis command needed - the LLM's understanding of context and intent is superior to keyword matching.

### Pattern 3: Execute MCP Tools

```bash
npx ts-node scripts/cli.ts call-tool memory add '{"key":"name","value":"Alice"}'
```

### Pattern 4: Use with Subagent

In main Claude conversation:

```
User: "I need to search the web and save results"
Main Agent: [Spawns mcp-manager subagent]
mcp-manager: Discovers brave-search + memory tools, reports back
Main Agent: Uses recommended tools for implementation
```

## Architecture

```
Main Agent (Claude)
    ↓ (delegates MCP tasks)
mcp-manager Subagent
    ↓ (uses skill)
mcp-management Skill
    ↓ (connects via)
MCP Servers (memory, filesystem, etc.)
```

**Benefits**:
- Main agent context stays clean
- MCP discovery happens in isolated subagent context
- Only relevant tool definitions loaded when needed
- Reduced token usage

## File Structure

```
mcp-management/
├── SKILL.md                    # Skill definition
├── README.md                   # This file
├── scripts/
│   ├── mcp-client.ts          # Core MCP client manager
│   ├── analyze-tools.ts       # Intelligent tool selection
│   ├── cli.ts                 # Command-line interface
│   ├── package.json           # Dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── .env.example           # Environment template
└── references/
    ├── mcp-protocol.md        # MCP protocol reference
    └── configuration.md       # Config guide
```

## Scripts Reference

### mcp-client.ts

Core client manager class:
- Load config from `.claude/.mcp.json`
- Connect to multiple MCP servers
- List/execute tools, prompts, resources
- Lifecycle management

### cli.ts

Command-line interface:
- `list-tools` - Show all tools and save to assets/tools.json
- `list-prompts` - Show all prompts
- `list-resources` - Show all resources
- `call-tool <server> <tool> <json>` - Execute tool

**Note**: Tool analysis is performed by the LLM reading `assets/tools.json`, which provides better context understanding than algorithmic matching.

## Configuration

### Environment Variables

Scripts check for variables in this order:

1. `process.env` (runtime)
2. `.claude/skills/mcp-management/.env`
3. `.claude/skills/.env`
4. `.claude/.env`

### MCP Config Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",          // Required
      "args": ["arg1", "arg2"],        // Required
      "env": {                          // Optional
        "VAR": "value",
        "API_KEY": "${ENV_VAR}"        // Reference env vars
      }
    }
  }
}
```

## Common MCP Servers

Install with `npx`:

- `@modelcontextprotocol/server-memory` - Key-value storage
- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-brave-search` - Web search
- `@modelcontextprotocol/server-puppeteer` - Browser automation
- `@modelcontextprotocol/server-fetch` - HTTP requests

## Integration with mcp-manager Agent

The `mcp-manager` agent (`.claude/agents/mcp-manager.md`) uses this skill to:

1. **Discover**: Connect to MCP servers, list capabilities
2. **Analyze**: Filter relevant tools for tasks
3. **Execute**: Call MCP tools on behalf of main agent
4. **Report**: Send concise results back to main agent

This architecture keeps main context clean and enables efficient MCP integration.

## Troubleshooting

### "Config not found"

Ensure `.claude/.mcp.json` exists and is valid JSON.

### "Server connection failed"

Check:
- Server command is installed (`npx` packages installed?)
- Server args are correct
- Environment variables are set

### "Tool not found"

List available tools first:
```bash
npx ts-node scripts/cli.ts list-tools
```

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/latest)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Skill References](./references/)

## License

MIT
