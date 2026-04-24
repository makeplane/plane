# Tool Design

Design effective tools for agent systems.

## Consolidation Principle

Single comprehensive tools > multiple narrow tools. **Target**: 10-20 tools max.

## Architectural Reduction Evidence

| Metric | 17 Tools | 2 Tools | Improvement |
|--------|----------|---------|-------------|
| Time | 274.8s | 77.4s | 3.5x faster |
| Success | 80% | 100% | +20% |
| Tokens | 102k | 61k | 37% fewer |

**Key**: Good documentation replaces tool sophistication.

## When Reduction Works

**Prerequisites**: High docs quality, capable model, navigable problem
**Avoid when**: Messy systems, specialized domain, safety-critical

## Description Engineering

Answer four questions:
1. **What** does the tool do?
2. **When** should it be used?
3. **What inputs** does it accept?
4. **What** does it return?

### Good Example

```json
{
  "name": "get_customer",
  "description": "Retrieve customer profile by ID. Use for order processing, support. Returns 404 if not found.",
  "parameters": {
    "customer_id": {"type": "string", "pattern": "^CUST-[0-9]{6}$"},
    "format": {"enum": ["concise", "detailed"]}
  }
}
```

### Poor Example

```json
{"name": "search", "description": "Search for things", "parameters": {"q": {}}}
```

## Error Messages

```python
def format_error(code, message, resolution):
    return {
        "error": {"code": code, "message": message,
                  "resolution": resolution, "retryable": code in RETRYABLE}
    }
# "Use YYYY-MM-DD format, e.g., '2024-01-05'"
```

## Response Formats

Offer concise vs detailed:

```python
def get_data(id, format="concise"):
    if format == "concise":
        return {"name": data.name}
    return data.full()  # Detailed
```

## Guidelines

1. Consolidate tools (target 10-20)
2. Answer all four questions
3. Use full parameter names
4. Design errors for recovery
5. Offer concise/detailed formats
6. Test with agents before deploy
7. Start minimal, add when proven

## Related

- [Context Fundamentals](./context-fundamentals.md)
- [Multi-Agent Patterns](./multi-agent-patterns.md)
