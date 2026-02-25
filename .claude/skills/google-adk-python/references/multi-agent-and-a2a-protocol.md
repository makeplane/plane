# Multi-Agent and A2A Protocol

## Sub-Agent Composition

```python
from google.adk.agents import Agent

code_agent = Agent(
    name="code_specialist", model="gemini-2.5-flash",
    description="Code generation/debugging", tools=[executor, linter]
)

research_agent = Agent(
    name="researcher", model="gemini-2.5-flash",
    description="Web search/analysis", tools=[search, scraper]
)

root = Agent(
    name="coordinator", model="gemini-2.5-flash",
    instruction="Route tasks to specialists.",
    sub_agents=[code_agent, research_agent]
)
```

## Coordinator Pattern

```python
coordinator = Agent(
    name="coordinator", model="gemini-2.5-flash",
    instruction="Delegate: code_specialist (programming), data_analyst (data), writer (docs)",
    sub_agents=[
        Agent(name="code_specialist", model="gemini-2.5-flash", tools=[code_tools]),
        Agent(name="data_analyst", model="gemini-2.5-flash", tools=[data_tools]),
        Agent(name="writer", model="gemini-2.5-flash", tools=[writing_tools])
    ]
)
```

## RemoteA2aAgent

```python
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent, AGENT_CARD_WELL_KNOWN_PATH

prime_checker = RemoteA2aAgent(
    name="prime", description="Check primes",
    agent_card=f"http://localhost:8001{AGENT_CARD_WELL_KNOWN_PATH}"
)

root = Agent(
    name="coordinator", model="gemini-2.5-flash",
    sub_agents=[prime_checker, Agent(name="calc", model="gemini-2.5-flash", tools=[calc])]
)
```

## Global Instruction

```python
root = Agent(
    name="customer_service", model="gemini-2.5-flash",
    instruction="Handle inquiries",
    global_instruction="Be polite, follow privacy policy, escalate if uncertain",
    sub_agents=[
        Agent(name="billing", model="gemini-2.5-flash", tools=[billing]),
        Agent(name="tech", model="gemini-2.5-flash", tools=[tech])
    ]
)
```

## Patterns

### Pipeline

```python
from google.adk.agents import SequentialAgent

pipeline = SequentialAgent(
    name="content",
    sub_agents=[
        Agent(name="researcher", model="gemini-2.5-flash", tools=[search]),
        Agent(name="writer", model="gemini-2.5-flash", tools=[write]),
        Agent(name="editor", model="gemini-2.5-flash", tools=[edit])
    ]
)
```

### Parallel

```python
from google.adk.agents import ParallelAgent

parallel = ParallelAgent(
    name="multi_source",
    sub_agents=[
        Agent(name="web", model="gemini-2.5-flash", tools=[web]),
        Agent(name="db", model="gemini-2.5-flash", tools=[db]),
        Agent(name="api", model="gemini-2.5-flash", tools=[api])
    ]
)
```

### Hierarchical

```python
backend = Agent(name="backend", model="gemini-2.5-flash",
    sub_agents=[Agent(name="api", tools=[api]), Agent(name="db", tools=[db])])
frontend = Agent(name="frontend", model="gemini-2.5-flash",
    sub_agents=[Agent(name="ui", tools=[ui]), Agent(name="ux", tools=[ux])])
root = Agent(name="root", model="gemini-2.5-flash", sub_agents=[backend, frontend])
```

### Iterative

```python
from google.adk.agents import LoopAgent

loop = LoopAgent(
    name="review",
    sub_agents=[
        Agent(name="generator", model="gemini-2.5-flash", tools=[gen]),
        Agent(name="reviewer", model="gemini-2.5-flash", tools=[lint])
    ],
    max_iterations=3
)
```

## A2A Protocol

```python
from google.adk.servers.a2a_server import create_a2a_server
app = create_a2a_server(root_agent)
# Run: uvicorn my_agent:app --host 0.0.0.0 --port 8000
```

Agent card: `/.well-known/agent.json`

Flow: 1) Client requests card 2) Card describes capabilities 3) Client sends task 4) Server streams events

## Best Practices

- Descriptive `description` for routing
- Focused coordinator instructions
- Combine local/remote agents
- Use `global_instruction` for cross-cutting concerns
- Apply workflow agents for orchestration
- Cache remote cards, handle failures
