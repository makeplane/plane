# Callbacks, Plugins, Observability

## Callback Types

- `before_agent`, `after_agent`: Agent lifecycle
- `before_model`, `after_model`: LLM calls
- `before_tool`, `after_tool`: Tool execution

## Callback Signatures

```python
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.content import ModelContent
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.adk.tools.tool_context import ToolContext

def before_agent_callback(callback_context: CallbackContext) -> None:
    print(f"Agent: {callback_context.agent_name}")

def after_agent_callback(callback_context: CallbackContext) -> ModelContent | None:
    return None

def before_model_callback(callback_context: CallbackContext, llm_request: LlmRequest) -> None:
    print(f"Model: {llm_request.model_id}")

def after_model_callback(callback_context: CallbackContext, llm_response: LlmResponse) -> None:
    print(f"Tokens: {llm_response.usage_metadata}")

def before_tool_callback(tool: str, args: dict, tool_context: ToolContext) -> None:
    print(f"Tool: {tool}")

def after_tool_callback(tool: str, args: dict, tool_context: ToolContext, response: Any) -> Any:
    return response
```

## Using Callbacks

```python
from google.adk.agents.web_agent import WebAgent

agent = WebAgent(
    name='my_agent', model='gemini-2.5-flash',
    before_agent_callback=before_agent_callback,
    before_model_callback=[callback1, callback2]
)

# Async supported
async def async_callback(callback_context: CallbackContext) -> None:
    await log_to_database(callback_context)
```

## Plugins

```python
from google.adk.plugins.base_plugin import BasePlugin
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest

class CountPlugin(BasePlugin):
    def __init__(self):
        super().__init__(name='count')
        self.count = 0

    async def before_agent_callback(self, *, agent, callback_context: CallbackContext):
        self.count += 1
        print(f"#{self.count}")

    async def before_model_callback(self, *, callback_context: CallbackContext, llm_request: LlmRequest):
        print(f"Model: {llm_request.model_id}")

agent = WebAgent(name='agent', model='gemini-2.5-flash', plugins=[CountPlugin()])
```

## Built-in Plugins

```python
from google.adk.plugins.save_files_as_artifacts_plugin import SaveFilesAsArtifactsPlugin
from google.adk.plugins.context_filter_plugin import ContextFilterPlugin

plugin1 = SaveFilesAsArtifactsPlugin()
plugin2 = ContextFilterPlugin(filter_fn=lambda ctx: ctx.priority > 5)
agent = WebAgent(name='agent', model='gemini-2.5-flash', plugins=[plugin1, plugin2])
```

## Observability

### Arize Phoenix

```python
from phoenix.otel import register

tracer_provider = register(
    project_name='my_project',
    endpoint='http://localhost:6006/v1/traces'
)

agent = WebAgent(name='agent', model='gemini-2.5-flash')
result = await agent.run('What is 2+2?')
```

### Custom Metrics

```python
class MetricsPlugin(BasePlugin):
    def __init__(self):
        super().__init__(name='metrics')
        self.latencies = []

    async def before_model_callback(self, *, callback_context, llm_request):
        callback_context.start_time = time.time()

    async def after_model_callback(self, *, callback_context, llm_response):
        latency = time.time() - callback_context.start_time
        self.latencies.append(latency)
        print(f"Avg: {sum(self.latencies) / len(self.latencies):.2f}s")
```
