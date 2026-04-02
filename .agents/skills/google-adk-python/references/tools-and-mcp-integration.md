# Tools and MCP Integration

## Custom Tools

Python functions (sync/async) with optional `ToolContext`.

```python
def calculator(operation: str, a: float, b: float) -> float:
    """Perform math operations.
    Args: operation ('add'|'subtract'|'multiply'|'divide'), a, b
    Returns: Result
    """
    ops = {"add": a + b, "subtract": a - b, "multiply": a * b, "divide": a / b}
    return ops[operation]
```

**Async with ToolContext:**

```python
from google.adk.tools.tool_context import ToolContext

async def fetch(url: str, tool_context: ToolContext) -> dict:
    cache = tool_context.state.get("cache", {})
    if url in cache: return cache[url]
    data = await http_client.get(url)
    cache[url] = data
    tool_context.state["cache"] = cache
    return data
```

## ToolContext

Props: `state` (dict), `save_artifact()`, `load_artifact()`

```python
def store(key: str, value: str, tool_context: ToolContext) -> dict:
    tool_context.state[key] = value
    return {"status": "saved"}

from google.genai import types

async def save_doc(name: str, content: str, tool_context: ToolContext) -> dict:
    part = types.Part(inline_data=types.Blob(mime_type="text/plain", data=content.encode()))
    version = await tool_context.save_artifact(name, part)
    return {"name": name, "version": version}

async def load_doc(name: str, tool_context: ToolContext) -> str:
    artifact = await tool_context.load_artifact(name)
    return artifact.inline_data.data.decode() if artifact else None
```

## Built-in Tools

```python
from google.adk.tools import google_search, load_artifacts, BuiltInCodeExecutor

executor = BuiltInCodeExecutor()
agent = Agent(name="agent", model="gemini-2.5-flash", tools=[google_search, load_artifacts, executor])
```

## MCP Integration

```python
from google.adk.tools.mcp_tool import StdioConnectionParams
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from mcp import StdioServerParameters

filesystem_mcp = MCPToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command='npx',
            args=['-y', '@modelcontextprotocol/server-filesystem', '/home/user/docs']
        ),
        timeout=5
    ),
    tool_filter=['read_file', 'list_directory']
)

agent = Agent(name="agent", model="gemini-2.5-flash", tools=[filesystem_mcp])
```

**Multiple servers:**

```python
git_mcp = MCPToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(command='npx', args=['-y', '@modelcontextprotocol/server-git']),
        timeout=10
    )
)

postgres_mcp = MCPToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command='npx', args=['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/db']
        ),
        timeout=15
    )
)

agent = Agent(name="agent", model="gemini-2.5-flash", tools=[filesystem_mcp, git_mcp, postgres_mcp])
```

## Tool Filtering

```python
# List
MCPToolset(connection_params=params, tool_filter=['read_file', 'write_file'])

# Lambda
MCPToolset(connection_params=params, tool_filter=lambda t: t.name.startswith('read_'))
```

## LongRunningFunctionTool

```python
from google.adk.tools.long_running_tool import LongRunningFunctionTool

async def approve(amount: float) -> dict:
    return {"approved": True}

tool = LongRunningFunctionTool(func=approve)
agent = Agent(name="agent", model="gemini-2.5-flash", tools=[tool])
```

## ExampleTool

```python
from google.adk.tools.example_tool import ExampleTool

examples = ExampleTool(examples=[
    {"input": "2+2?", "output": "4"},
    {"input": "Capital of France?", "output": "Paris"}
])

agent = Agent(name="agent", model="gemini-2.5-flash", tools=[examples])
```

## Best Practices

- Docstrings with Args/Returns for schema
- Async for I/O
- ToolContext.state for session data
- Artifacts for binary/large data
- Filter MCP tools to reduce context
- Validate inputs
