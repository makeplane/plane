"""Automation Node Registry

This module provides:
1. NodeRegistry  – singleton container mapping `node.name` → NodeMeta
2. register_node – decorator for easy registration
3. BaseAutomationNode – optional OO style handler base class

The registry is kept simple so it can be imported confidently in Django AppConfig.ready().
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, Type

from pydantic import BaseModel

__all__ = [
    "NodeRegistry",
    "register_node",
    "BaseAutomationNode",
    "NodeMeta",
]


@dataclass(frozen=True)
class NodeMeta:
    """Metadata for a registered node."""

    name: str
    node_type: str  # trigger / action / condition
    handler: Callable  # the callable that performs the work
    schema: Type[BaseModel]  # pydantic schema for params validation


class NodeRegistry:
    """Singleton in-memory registry for automation nodes."""

    _instance: "NodeRegistry | None" = None
    _registry: Dict[str, NodeMeta]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._registry = {}
        return cls._instance

    # ---------------------------------------------------------------------
    # API
    # ---------------------------------------------------------------------
    def register(
        self, name: str, node_type: str, handler: Callable, schema: Type[BaseModel]
    ):
        if name in self._registry:
            raise ValueError(f"Node '{name}' already registered")
        self._registry[name] = NodeMeta(name, node_type, handler, schema)

    def get(self, name: str) -> NodeMeta:
        return self._registry[name]

    def all(self) -> Dict[str, NodeMeta]:
        return dict(self._registry)


# -------------------------------------------------------------------------
# Decorator
# -------------------------------------------------------------------------


def register_node(name: str, node_type: str, schema: Type[BaseModel]):
    """Decorator to register a function/class as an automation node.

    Example usage:
    ```python
    @register_node("record_created", "trigger", RecordCreatedParams)
    def record_created(event, context):
        ...
    ```
    """

    def decorator(func_or_cls):
        NodeRegistry().register(name, node_type, func_or_cls, schema)
        return func_or_cls

    return decorator


# -------------------------------------------------------------------------
# Optional OO-style base class
# -------------------------------------------------------------------------


class BaseAutomationNode:
    """Optional abstract base class for object-oriented nodes."""

    schema: Type[BaseModel]
    node_type: str
    name: str

    def __init__(self, **params):
        self.params = self.schema(**params)

    def execute(self, event: dict, context: dict):  # noqa: D401 – simple signature
        """Perform node work. Subclasses *must* override."""
        raise NotImplementedError("execute() must be implemented by subclasses")


# -------------------------------------------------------------------------
# Convenience base classes for common node types
# -------------------------------------------------------------------------


class TriggerNode(BaseAutomationNode):
    """Base class for Trigger nodes (node_type is auto-set)."""

    node_type: str = "trigger"


class ActionNode(BaseAutomationNode):
    """Base class for Action nodes (node_type is auto-set)."""

    node_type: str = "action"
