from typing import Callable, Dict, Any

_TOOLS: Dict[str, Callable] = {}
_TOOLS_SCHEMA: list = []


def register_tool(name: str, description: str, input_schema: dict):
    """Decorator to register a function as an AI tool."""
    def decorator(fn: Callable) -> Callable:
        _TOOLS[name] = fn
        _TOOLS_SCHEMA.append({
            "name": name,
            "description": description,
            "input_schema": input_schema,
        })
        return fn
    return decorator


def get_tools_schema() -> list:
    return _TOOLS_SCHEMA


def get_tool(name: str) -> Callable | None:
    return _TOOLS.get(name)
