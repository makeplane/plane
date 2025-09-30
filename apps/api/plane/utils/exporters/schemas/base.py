from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


@dataclass
class ExportField:
    """Base export field class for generic fields."""

    source: Optional[str | Callable[[Any, Dict[str, Any]], Any]] = None
    transform: Optional[Callable[[Any, Dict[str, Any]], Any]] = None
    default: Any = ""
    label: Optional[str] = None  # Display name for export headers

    def get_value(self, obj: Any, context: Dict[str, Any]) -> Any:
        raw: Any
        if callable(self.source):
            try:
                raw = self.source(obj, context)
            except TypeError:
                raw = self.source(obj)
        elif isinstance(self.source, str) and self.source:
            raw = self._resolve_dotted_path(obj, self.source)
        else:
            raw = obj

        if self.transform is not None:
            try:
                return self.transform(raw, context)
            except TypeError:
                return self.transform(raw)

        return self._format_value(raw)

    def _format_value(self, raw: Any) -> Any:
        """Format the raw value. Override in subclasses for type-specific formatting."""
        return raw if raw is not None else self.default

    def _resolve_dotted_path(self, obj: Any, path: str) -> Any:
        current = obj
        for part in path.split("."):
            if current is None:
                return None
            if hasattr(current, part):
                current = getattr(current, part)
            elif isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current


@dataclass
class StringField(ExportField):
    """Export field for string values."""

    default: str = ""

    def _format_value(self, raw: Any) -> str:
        if raw is None:
            return self.default
        return str(raw)


@dataclass
class DateField(ExportField):
    """Export field for date values with automatic conversion."""

    default: str = ""

    def _format_value(self, raw: Any) -> str:
        if raw is None:
            return self.default
        # Convert date to formatted string
        if hasattr(raw, "strftime"):
            return raw.strftime("%a, %d %b %Y")
        return str(raw)


@dataclass
class DateTimeField(ExportField):
    """Export field for datetime values with automatic conversion."""

    default: str = ""

    def _format_value(self, raw: Any) -> str:
        if raw is None:
            return self.default
        # Convert datetime to formatted string
        if hasattr(raw, "strftime"):
            return raw.strftime("%a, %d %b %Y %I:%M:%S %Z%z")
        return str(raw)


@dataclass
class NumberField(ExportField):
    """Export field for numeric values."""

    default: Any = ""

    def _format_value(self, raw: Any) -> Any:
        if raw is None:
            return self.default
        return raw


@dataclass
class BooleanField(ExportField):
    """Export field for boolean values."""

    default: bool = False

    def _format_value(self, raw: Any) -> bool:
        if raw is None:
            return self.default
        return bool(raw)


@dataclass
class ListField(ExportField):
    """Export field for list/array values.

    Returns the list as-is by default. The formatter will handle conversion to strings
    when needed (e.g., CSV/XLSX will join with separator, JSON will keep as array).
    """

    default: Optional[List] = field(default_factory=list)

    def _format_value(self, raw: Any) -> List[Any]:
        if raw is None:
            return self.default if self.default is not None else []
        if isinstance(raw, (list, tuple)):
            return list(raw)
        return [raw]  # Wrap single items in a list


@dataclass
class JSONField(ExportField):
    """Export field for complex JSON-serializable values (dicts, lists of dicts, etc).

    Preserves the structure as-is for JSON exports. For CSV/XLSX, the formatter
    will handle serialization (e.g., JSON stringify).
    """

    default: Any = field(default_factory=dict)

    def _format_value(self, raw: Any) -> Any:
        if raw is None:
            return self.default
        # Return as-is - should be JSON-serializable
        return raw


class ExportSchemaMeta(type):
    def __new__(mcls, name, bases, attrs):
        declared: Dict[str, ExportField] = {
            key: value for key, value in list(attrs.items()) if isinstance(value, ExportField)
        }
        for key in declared.keys():
            attrs.pop(key)
        cls = super().__new__(mcls, name, bases, attrs)
        base_fields: Dict[str, ExportField] = {}
        for base in bases:
            if hasattr(base, "_declared_fields"):
                base_fields.update(base._declared_fields)
        base_fields.update(declared)
        cls._declared_fields = base_fields
        return cls


class ExportSchema(metaclass=ExportSchemaMeta):
    def __init__(self, context: Optional[Dict[str, Any]] = None) -> None:
        self.context = context or {}

    def serialize(self, obj: Any) -> Dict[str, Any]:
        output: Dict[str, Any] = {}
        for field_name, export_field in self._declared_fields.items():
            # Prefer explicit preparer methods if present
            preparer = getattr(self, f"prepare_{field_name}", None)
            if callable(preparer):
                try:
                    output[field_name] = preparer(obj)
                except TypeError:
                    output[field_name] = preparer(obj, self.context)
                continue

            output[field_name] = export_field.get_value(obj, self.context)
        return output
