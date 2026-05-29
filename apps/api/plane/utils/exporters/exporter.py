from typing import Any, Dict, List, Type, Union

from django.db.models import QuerySet

from .formatters import CSVFormatter, JSONFormatter, XLSXFormatter


class Exporter:
    """Generic exporter class that handles data exports using different formatters."""

    # Available formatters
    FORMATTERS = {
        "csv": CSVFormatter,
        "json": JSONFormatter,
        "xlsx": XLSXFormatter,
    }

    def __init__(self, format_type: str, schema_class: Type, options: Dict[str, Any] = None):
        """Initialize exporter with specified format type and schema.

        Args:
            format_type: The export format (csv, json, xlsx)
            schema_class: The schema class to use for field definitions
            options: Optional formatting options
        """
        if format_type not in self.FORMATTERS:
            raise ValueError(f"Unsupported format: {format_type}. Available: {list(self.FORMATTERS.keys())}")

        self.format_type = format_type
        self.schema_class = schema_class
        self.formatter = self.FORMATTERS[format_type]()
        self.options = options or {}

    def export(
        self,
        filename: str,
        data: Union[QuerySet, List[dict]],
        fields: List[str] = None,
    ) -> tuple[str, str | bytes]:
        """Export data using the configured formatter and return (filename, content).

        Args:
            filename: The filename for the export (without extension)
            data: Either a Django QuerySet or a list of already-serialized dicts
            fields: Optional list of field names to include in export

        Returns:
            Tuple of (filename_with_extension, content)
        """
        # Serialize the queryset if needed
        if isinstance(data, QuerySet):
            records = self.schema_class.serialize_queryset(data, fields=fields)
        else:
            # Already serialized data
            records = data

        # Merge fields into options for the formatter
        format_options = {**self.options}
        if fields:
            format_options["fields"] = fields

        return self.formatter.format(filename, records, self.schema_class, format_options)

    @classmethod
    def get_available_formats(cls) -> List[str]:
        """Get list of available export formats."""
        return list(cls.FORMATTERS.keys())

    @classmethod
    def register_formatter(cls, format_type: str, formatter_class: type) -> None:
        """Register a new formatter for a format type."""
        cls.FORMATTERS[format_type] = formatter_class
