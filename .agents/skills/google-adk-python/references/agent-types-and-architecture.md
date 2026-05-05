# Agent Types and Architecture

## LlmAgent

Dynamic routing agent.

**Properties:** `model`, `instruction`, `description`, `tools`, `sub_agents`, `generate_content_config`

```python
from google.adk.agents import Agent

agent = Agent(
    name="assistant", model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
    tools=[search_tool], sub_agents=[code_agent],
    generate_content_config={"temperature": 0.7}
)
```

## Workflow Agents

### SequentialAgent

```python
from google.adk.agents import SequentialAgent

pipeline = SequentialAgent(
    name="research_pipeline",
    sub_agents=[
        Agent(name="searcher", model="gemini-2.5-flash", tools=[search]),
        Agent(name="writer", model="gemini-2.5-flash", tools=[write]),
    ]
)
```

### ParallelAgent

```python
from google.adk.agents import ParallelAgent

parallel = ParallelAgent(
    name="multi_source",
    sub_agents=[
        Agent(name="web", model="gemini-2.5-flash", tools=[web_search]),
        Agent(name="db", model="gemini-2.5-flash", tools=[db_query]),
    ]
)
```

### LoopAgent

```python
from google.adk.agents import LoopAgent

loop = LoopAgent(
    name="refiner",
    sub_agents=[
        Agent(name="generator", model="gemini-2.5-flash", tools=[generate]),
        Agent(name="validator", model="gemini-2.5-flash", tools=[validate]),
    ],
    max_iterations=5,
)
```

## BaseAgent

Override `run_async()` and `get_agent_card()`.

```python
from google.adk.agents.base_agent import BaseAgent

class CustomAgent(BaseAgent):
    async def run_async(self, query: str, context: dict) -> dict:
        return {"response": "Custom"}
```

## Agent Structure

```
my_agent/
├── __init__.py      # Export root_agent or app
├── agent.py         # Agent definition
└── tools.py         # Custom tools
```

```python
# __init__.py
from my_agent.agent import root_agent
__all__ = ["root_agent"]

# agent.py
from google.adk.agents import Agent
root_agent = Agent(name="my_agent", model="gemini-2.5-flash", instruction="...")

# A2A server
from google.adk.servers.a2a_server import create_a2a_server
app = create_a2a_server(root_agent)
```

## Source Structure

```
src/google/adk/
├── agents/                # Agent implementations
├── tools/                 # Tool system
├── sessions/              # Session management
├── runners/               # Execution orchestration
└── servers/               # A2A server utilities
```

## Global Instructions

```python
root = Agent(
    name="root", model="gemini-2.5-flash",
    instruction="Root behavior.",
    global_instruction="Always be polite and concise.",
    sub_agents=[Agent(name="sub1", model="gemini-2.5-flash")]
)
```

## Best Practices

- Use descriptive `name`/`description` for routing
- Keep `instruction` focused on single responsibility
- Delegate specialized tasks to sub-agents
- Use workflow agents for orchestration
- Export `root_agent` or `app` from `__init__.py`
