# MCP + Skills Integration

## The Kitchen Analogy

- **MCP** provides the professional kitchen: access to tools, ingredients, equipment
- **Skills** provide the recipes: step-by-step instructions to create something valuable

Together, they enable users to accomplish complex tasks without figuring out every step.

## How They Work Together

| MCP (Connectivity) | Skills (Knowledge) |
|---|---|
| Connects Claude to services (Notion, Asana, Linear) | Teaches Claude how to use services effectively |
| Provides real-time data access and tool invocation | Captures workflows and best practices |
| What Claude *can* do | How Claude *should* do it |

## Without Skills (MCP only)

- Users connect MCP but don't know what to do next
- Support tickets: "how do I do X with your integration?"
- Each conversation starts from scratch
- Inconsistent results (users prompt differently)
- Users blame connector when issue is workflow guidance

## With Skills (MCP + Skills)

- Pre-built workflows activate automatically
- Consistent, reliable tool usage
- Best practices embedded in every interaction
- Lower learning curve for integration

## Building MCP-Enhanced Skills

### Key Techniques

1. **Reference correct MCP tool names** — tool names are case-sensitive
2. **Include error handling** for common MCP issues (connection refused, auth expired)
3. **Embed domain expertise** users would otherwise need to specify each time
4. **Coordinate multiple MCP calls** in sequence with data passing between steps
5. **Add fallback instructions** when MCP is unavailable

### Example: MCP Enhancement Skill Structure

```markdown
## Prerequisites
- [Service] MCP server must be connected (Settings > Extensions)
- Valid API key with [specific scopes]

## Workflow: [Task Name]
### Step 1: Fetch Context
Call `mcp_tool_name` with parameters from user input
### Step 2: Process
Apply domain rules to MCP response
### Step 3: Execute
Call `mcp_action_tool` with processed data
### Step 4: Verify
Confirm action completed, report results

## Troubleshooting
If "Connection refused": verify MCP server running
If auth error: check API key in Settings > Extensions
```

## Positioning MCP + Skills

**Focus on outcomes:**
> "The ProjectHub skill enables teams to set up complete project workspaces in seconds — instead of 30 minutes on manual setup."

**Not features:**
> ~~"The ProjectHub skill is a folder containing YAML frontmatter that calls our MCP server tools."~~
