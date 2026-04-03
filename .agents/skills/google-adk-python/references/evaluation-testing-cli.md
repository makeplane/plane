# Evaluation, Testing, CLI

## CLI Commands

```bash
adk web samples/agents/my_agent.py:agent --port 8080
adk run samples/agents/my_agent.py:agent "What is 2+2?" --streaming
adk api_server samples/agents/my_agent.py:agent --port 8000
adk eval --agent my_agent.py:agent --evalset evals/evalset.json
adk deploy --target cloud-run --agent my_agent.py:agent
```

## Evaluation

### Evalset JSON

```json
{
  "name": "math_evalset",
  "test_cases": [
    {"id": "add", "input": "2+2?", "expected_output": "4", "evaluation_type": "exact_match"},
    {"id": "mult", "input": "5*6?", "expected_output": "30", "evaluation_type": "contains"},
    {"id": "judge", "input": "(10+5)*2", "expected_output": "30", "evaluation_type": "llm_judge"}
  ]
}
```

Types: `exact_match`, `contains`, `regex`, `llm_judge`

### Running Evals

```python
from google.adk.evaluation import Evaluator, EvalCase, EvalResult

evaluator = Evaluator(agent=my_agent, evalset='evals/math.json')
results = await evaluator.run()

# Custom
def custom_eval(case: EvalCase, response: str) -> EvalResult:
    passed = response.strip().lower() == case.expected_output.lower()
    return EvalResult(passed=passed, score=1.0 if passed else 0.0)

evaluator = Evaluator(agent=my_agent, evalset='evals/custom.json', eval_fn=custom_eval)
```

## Testing

```bash
uv sync --extra test --extra eval --extra a2a
pytest tests/unittests -n auto
pytest tests/unittests --cov=google.adk
```

```python
# conftest.py
import pytest
from google.adk.agents.web_agent import WebAgent

@pytest.fixture
def test_agent():
    return WebAgent(name='test', model='gemini-2.5-flash')

# test_agent.py
@pytest.mark.asyncio
async def test_basic():
    agent = WebAgent(name='test', model='gemini-2.5-flash')
    result = await agent.run('What is 2+2?')
    assert '4' in result.text

@pytest.mark.asyncio
async def test_tools():
    def calc(a: int, b: int) -> int: return a + b
    agent = WebAgent(name='test', model='gemini-2.5-flash', tools=[calc])
    result = await agent.run('Add 5 and 7')
    assert '12' in result.text

# Integration
@pytest.mark.asyncio
async def test_multi_turn():
    agent = WebAgent(name='test', model='gemini-2.5-flash')
    r1 = await agent.run('My name is Alice')
    r2 = await agent.run('What is my name?')
    assert 'Alice' in r2.text
```

## Formatting

```bash
./autoformat.sh
pyink --line-length 80 --pyink-indentation 2 src/
isort src/
```

## Style

- Google Python Style Guide
- 2-space indent, 80 chars
- Type hints, docstrings

```python
def my_func(arg1: str, arg2: int) -> bool:
  """Short description.

  Args:
    arg1: First
    arg2: Second

  Returns:
    Result
  """
  return True
```
