---
name: google-adk-python
description: "Build AI agents with Google ADK Python. Multi-agent systems, A2A protocol, MCP tools, workflow agents, state/memory, callbacks/plugins, Vertex AI deployment, evaluation."
license: Apache-2.0
version: 2.0.0
---

# Google ADK Python Skill

Expert guide for Google's Agent Development Kit (ADK) Python — open-source, code-first toolkit for building, evaluating, and deploying AI agents. Optimized for Gemini, model-agnostic by design.

## When to Activate

- Build single or multi-agent systems with tool integration
- Implement A2A protocol for remote agent communication
- Integrate MCP servers as agent tools
- Use workflow agents (sequential, parallel, loop) for pipelines
- Manage sessions, state, memory, and artifacts
- Add callbacks, plugins, or observability hooks
- Deploy to Cloud Run, Vertex AI Agent Engine, or GKE
- Evaluate agents with `adk eval` framework

## Agent Structure Convention (Required)

```
my_agent/
├── __init__.py   # MUST: from . import agent
└── agent.py      # MUST: root_agent = Agent(...) OR app = App(...)
```

## Quick Start

```bash
pip install google-adk          # stable (weekly releases)
uv sync --all-extras            # dev setup (uv required, Python 3.10+, 3.11+ recommended)
```

```python
from google.adk import Agent

root_agent = Agent(
    name="assistant",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
    description="General assistant agent.",
    tools=[get_weather],
)
```

## App Pattern (Production)

```python
from google.adk import Agent
from google.adk.apps import App
from google.adk.apps.app import EventsCompactionConfig
from google.adk.plugins.save_files_as_artifacts_plugin import SaveFilesAsArtifactsPlugin

app = App(
    name="my_app",
    root_agent=Agent(name="my_agent", model="gemini-2.5-flash", ...),
    plugins=[SaveFilesAsArtifactsPlugin()],
    events_compaction_config=EventsCompactionConfig(compaction_interval=2),
)
```

Use `App` when needing plugins, event compaction, or custom lifecycle management.

## CLI Tools

| Command | Purpose |
|---------|---------|
| `adk web <agents_dir>` | Dev UI (recommended for development) |
| `adk run <agent_dir>` | Interactive CLI testing |
| `adk api_server <agents_dir>` | FastAPI production server |
| `adk eval <agent> <evalset.json>` | Run evaluation suite |

## Agent Types

| Type | Use Case |
|------|----------|
| `Agent` / `LlmAgent` | Dynamic routing, tool use, reasoning |
| `SequentialAgent` | Fixed-order pipeline |
| `ParallelAgent` | Concurrent execution |
| `LoopAgent` | Iterative processing |
| `RemoteA2aAgent` | Remote agent via A2A protocol |

## Key APIs

| Feature | API |
|---------|-----|
| State | `tool_context.state[key] = value` |
| Artifacts | `tool_context.save_artifact(name, part)` |
| Callbacks | `before_agent_callback`, `after_model_callback`, etc. |
| MCP Tools | `MCPToolset(connection_params=StdioConnectionParams(...))` |
| Sub-agents | `Agent(..., sub_agents=[agent1, agent2])` |
| Human-in-loop | `LongRunningFunctionTool(func=my_func)` |
| Plugins | `App(..., plugins=[MyPlugin()])` |

## Model Support

Latest: `gemini-2.5-flash` (default), `gemini-2.5-pro`, `gemini-2.0-flash` (sunsets Mar 2026)
Preview: `gemini-3-flash-preview`, `gemini-3-pro-preview`
Also: Anthropic Claude, Ollama, LiteLLM, vLLM, Model Garden

## Best Practices

1. **Code-first** — define agents in Python for version control and testing
2. **Agent convention** — always use `root_agent` or `app` variable in `agent.py`
3. **Modular agents** — specialize per domain, compose via `sub_agents`
4. **Workflow selection** — workflow agents for predictable, LlmAgent for dynamic
5. **State** — `ToolContext.state` for ephemeral, `MemoryService` for long-term
6. **Safety** — callbacks for guardrails, tool confirmation for sensitive ops
7. **Evaluate** — test with `adk eval` + evalset JSON before deployment

## References

Detailed guides (load as needed):

- `references/agent-types-and-architecture.md` — Agent types, workflows, custom agents
- `references/tools-and-mcp-integration.md` — Custom tools, MCP, tool filtering
- `references/multi-agent-and-a2a-protocol.md` — Sub-agents, A2A, coordinator patterns
- `references/sessions-state-memory-artifacts.md` — State, artifacts, sessions, memory
- `references/callbacks-plugins-observability.md` — Lifecycle hooks, plugins, tracing
- `references/evaluation-testing-cli.md` — adk eval, CLI, evalset format
- `references/deployment-cloud-run-vertex-gke.md` — Cloud Run, Vertex AI, GKE

## External Resources

- GitHub: https://github.com/google/adk-python
- Docs: https://google.github.io/adk-docs/
- Samples: https://github.com/google/adk-python/tree/main/contributing/samples
- llms.txt: https://raw.githubusercontent.com/google/adk-python/refs/heads/main/llms.txt
