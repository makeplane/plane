# Sessions, State, Memory, Artifacts

## ToolContext.state

Ephemeral dict persisting across tool calls within session.

```python
from google.adk.tools.tool_context import ToolContext

def save_user(user_id: str, name: str, tool_context: ToolContext) -> dict:
    if "users" not in tool_context.state:
        tool_context.state["users"] = {}
    tool_context.state["users"][user_id] = name
    return {"status": "saved"}

def get_user(user_id: str, tool_context: ToolContext) -> str:
    return tool_context.state.get("users", {}).get(user_id, "not_found")

def increment(tool_context: ToolContext) -> int:
    count = tool_context.state.get("counter", 0) + 1
    tool_context.state["counter"] = count
    return count
```

Lifecycle: Created per session, cleared on end, not shared.

## Artifacts

Versioned binary storage.

```python
from google.genai import types
from google.adk.tools.tool_context import ToolContext

async def save_text(name: str, content: str, tool_context: ToolContext) -> dict:
    part = types.Part(inline_data=types.Blob(mime_type="text/plain", data=content.encode()))
    version = await tool_context.save_artifact(name, part)
    return {"name": name, "version": version}

async def save_image(name: str, bytes: bytes, tool_context: ToolContext) -> dict:
    part = types.Part(inline_data=types.Blob(mime_type="image/png", data=bytes))
    version = await tool_context.save_artifact(name, part)
    return {"name": name, "version": version}

async def load_text(name: str, tool_context: ToolContext) -> str:
    artifact = await tool_context.load_artifact(name)
    return artifact.inline_data.data.decode() if artifact else None

async def load_version(name: str, version: int, tool_context: ToolContext) -> str:
    artifact = await tool_context.load_artifact(name, version=version)
    return artifact.inline_data.data.decode() if artifact else None
```

Versioning: Each save creates new version (1, 2, 3...), load without version returns latest.

## Session Services

```python
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.sessions.vertex_ai_session_service import VertexAiSessionService
from google.adk.sessions.spanner_session_service import SpannerSessionService
from google.adk.runners import Runner

# Dev
session_service = InMemorySessionService()

# Prod (Vertex)
session_service = VertexAiSessionService(project_id="my-project", location="us-central1")

# Prod (Spanner)
session_service = SpannerSessionService(
    project_id="my-project", instance_id="my-instance", database_id="sessions"
)

runner = Runner(agent=root_agent, session_service=session_service)
```

## Memory

Long-term recall across sessions.

```python
from google.adk.memory import MemoryService

memory_service = MemoryService(project_id="my-project", location="us-central1")
runner = Runner(agent=root_agent, session_service=session_service, memory_service=memory_service)
```

**Comparison:** State (ephemeral, dict), Artifacts (versioned binary, session), Memory (long-term, cross-session)

## Runner

```python
from google.adk.runners import Runner

runner = Runner(agent=root_agent, session_service=session_service)

# Production (streaming)
async def execute():
    async for event in runner.run_async("Query", session_id="user-123"):
        if event.text: print(event.text, end="")
        if event.tool_call: print(f"\nTool: {event.tool_call.name}")

# Bidi-streaming
async def live():
    async for event in runner.run_live(session_id="user-456"):
        if event.server_content: print(event.server_content)
        if user_has_input(): await event.send(get_user_input())

# Sync (debug)
result = runner.run("Query", session_id="debug")
```

## Invocation Lifecycle

1. Session retrieval 2. Context creation 3. Agent execution 4. Event streaming 5. Compaction

```python
runner = Runner(agent=root_agent, session_service=session_service, compaction_threshold=20)
await runner.compact_session("long-session")
```

## Best Practices

- State: temporary session data
- Artifacts: binary/large data
- Memory: long-term knowledge
- Session service by env (InMemory dev, Vertex/Spanner prod)
- Enable compaction for long conversations
- run_async for production, run_live for bidirectional, run for debug
- Clean old sessions, version artifacts
