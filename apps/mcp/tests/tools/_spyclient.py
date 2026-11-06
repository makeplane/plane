"""A stand-in Plane client that validates calls against the real SDK.

Dispatch tests need a client that does not hit the network, but a plain mock
accepts anything -- including a misspelled keyword or a dict where the SDK wants
a Pydantic params model. Both mistakes reach production as an AttributeError or
a silently ignored argument.

This spy mirrors the real `PlaneClient`, binds every call against the genuine
signature, and type-checks each argument with the genuine annotation.
"""

from __future__ import annotations

import inspect
import typing
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any, get_args, get_origin, get_type_hints

from plane import PlaneClient
from pydantic import BaseModel, TypeAdapter

types_UnionType = type(int | str)  # `X | Y` annotations are not typing.Union


@dataclass
class Call:
    method: str
    kwargs: dict[str, Any]


class Auto:
    """A permissive stand-in for an SDK response.

    Any attribute yields another Auto, so dispatch code that reads
    `response.results` or `cycle.end_date` runs to completion. It is falsy and
    empty, so `items or []` and iteration both behave.
    """

    def __getattr__(self, name: str) -> Auto:
        return Auto()

    def __call__(self, *args: Any, **kwargs: Any) -> Auto:
        return Auto()

    def __bool__(self) -> bool:
        return False

    def __iter__(self):
        return iter(())

    def items(self):
        return iter(())


@dataclass
class Recorder:
    calls: list[Call] = field(default_factory=list)

    def only(self) -> Call:
        assert len(self.calls) == 1, f"expected exactly one SDK call, got {[c.method for c in self.calls]}"
        return self.calls[0]

    @property
    def methods(self) -> list[str]:
        return [call.method for call in self.calls]


def _adapter_cache() -> dict[Any, TypeAdapter]:
    return _ADAPTERS


_ADAPTERS: dict[Any, TypeAdapter] = {}


def _members(annotation: Any) -> list[Any]:
    """Flatten a union into its members; a non-union yields itself."""
    if get_origin(annotation) in (typing.Union, types_UnionType):
        return [arg for arg in get_args(annotation) if arg is not type(None)]
    return [annotation]


def _accepts_mapping(annotation: Any) -> bool:
    for member in _members(annotation):
        origin = get_origin(member) or member
        if origin is Any:
            return True
        try:
            if isinstance(origin, type) and issubclass(origin, Mapping):
                return True
        except TypeError:
            continue
    return False


def _wants_model(annotation: Any) -> bool:
    for member in _members(annotation):
        origin = get_origin(member) or member
        if isinstance(origin, type) and issubclass(origin, BaseModel):
            return True
    return False


def _validate(method: str, param: inspect.Parameter, annotation: Any, value: Any) -> None:
    if annotation is inspect.Parameter.empty or annotation is Any:
        return

    # Pydantic happily coerces a dict into a model, but the SDK calls
    # `.model_dump()` on this argument -- a dict raises AttributeError at call
    # time. Reject it here instead of discovering it against a live workspace.
    if isinstance(value, Mapping) and _wants_model(annotation) and not _accepts_mapping(annotation):
        raise TypeError(
            f"{method}(): argument {param.name} was passed a dict, but the SDK types it as "
            f"{annotation} and calls .model_dump() on it. Build the model with as_params()."
        )

    cache = _adapter_cache()
    try:
        adapter = cache.get(annotation)
    except TypeError:  # an unhashable annotation cannot be cached, only built
        adapter = None
        cache = {}
    if adapter is None:
        try:
            adapter = TypeAdapter(annotation)
        except Exception:  # a few SDK annotations are not resolvable in isolation
            return
        cache[annotation] = adapter
    try:
        adapter.validate_python(value)
    except Exception as exc:
        raise TypeError(f"{method}(): argument {param.name}={value!r} does not satisfy {annotation}: {exc}") from exc


class _Method:
    def __init__(self, spy: SpyClient, path: str, fn: Any) -> None:
        self._spy = spy
        self._path = path
        self._fn = fn
        self._signature = inspect.signature(fn)
        try:
            self._hints = get_type_hints(fn)
        except Exception:
            self._hints = {}

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        bound = self._signature.bind(*args, **kwargs)
        for name, value in bound.arguments.items():
            param = self._signature.parameters[name]
            if param.kind in (param.VAR_POSITIONAL, param.VAR_KEYWORD):
                continue
            _validate(self._path, param, self._hints.get(name, param.annotation), value)
        self._spy.recorder.calls.append(Call(self._path, dict(bound.arguments)))
        prepared = self._spy.returns.get(self._path, self._spy.default)
        # An exception queued in `returns` is raised rather than handed back, so
        # a test can exercise how dispatch reacts to a 404 or a 401.
        if isinstance(prepared, BaseException):
            raise prepared
        return prepared


class _Namespace:
    """Mirrors one SDK resource, exposing only the methods it really has."""

    def __init__(self, spy: SpyClient, target: Any, path: str) -> None:
        self.__dict__["_spy"] = spy
        self.__dict__["_target"] = target
        self.__dict__["_path"] = path
        self.__dict__["_cache"] = {}

    def __getattr__(self, name: str) -> Any:
        cache = self.__dict__["_cache"]
        if name in cache:
            return cache[name]
        target = self.__dict__["_target"]
        spy = self.__dict__["_spy"]
        path = self.__dict__["_path"]
        if not hasattr(target, name):
            raise AttributeError(f"{path} has no attribute {name!r} -- the real SDK client does not either")
        attr = getattr(target, name)
        child_path = f"{path}.{name}" if path else name
        wrapped = _Method(spy, child_path, attr) if callable(attr) else _Namespace(spy, attr, child_path)
        cache[name] = wrapped
        return wrapped


class SpyClient(_Namespace):
    """Records calls against a real client's shape without performing them."""

    def __init__(self, returns: dict[str, Any] | None = None, default: Any = None) -> None:
        real = PlaneClient(api_key="spy", base_url="http://spy.invalid")
        super().__init__(self, real, "")
        self.__dict__["recorder"] = Recorder()
        self.__dict__["returns"] = returns or {}
        self.__dict__["default"] = Auto() if default is None else default

    @property
    def recorder(self) -> Recorder:
        return self.__dict__["recorder"]

    @property
    def returns(self) -> dict[str, Any]:
        return self.__dict__["returns"]

    @property
    def default(self) -> Any:
        return self.__dict__["default"]
