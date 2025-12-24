from typing import Dict, List, Union
from .formatters import BaseFormatter, CSVFormatter, JSONFormatter, XLSXFormatter


class DataExporter:
    """
    Export data using DRF serializers with built-in format support.

    Usage:
        # New simplified interface
        exporter = DataExporter(BookSerializer, format_type='csv')
        filename, content = exporter.export('books_export', queryset)

        # Legacy interface (still supported)
        exporter = DataExporter(BookSerializer)
        csv_string = exporter.to_string(queryset, CSVFormatter())
    """

    # Available formatters
    FORMATTERS = {
        "csv": CSVFormatter,
        "json": JSONFormatter,
        "xlsx": XLSXFormatter,
    }

    def __init__(self, serializer_class, format_type: str = None, **serializer_kwargs):
        """
        Initialize exporter with serializer and optional format type.

        Args:
            serializer_class: DRF serializer class to use for data serialization
            format_type: Optional format type (csv, json, xlsx). If provided, enables export() method.
            **serializer_kwargs: Additional kwargs to pass to serializer
        """
        self.serializer_class = serializer_class
        self.serializer_kwargs = serializer_kwargs
        self.format_type = format_type
        self.formatter = None

        if format_type:
            if format_type not in self.FORMATTERS:
                raise ValueError(f"Unsupported format: {format_type}. Available: {list(self.FORMATTERS.keys())}")
            # Create formatter with default options
            self.formatter = self._create_formatter(format_type)

    def _create_formatter(self, format_type: str) -> BaseFormatter:
        """Create formatter instance with appropriate options."""
        formatter_class = self.FORMATTERS[format_type]

        # Apply format-specific options
        if format_type == "xlsx":
            return formatter_class(list_joiner=", ")
        else:
            return formatter_class()

    def serialize(self, queryset) -> List[Dict]:
        """QuerySet → list of dicts"""
        serializer = self.serializer_class(
            queryset,
            many=True,
            **self.serializer_kwargs
        )
        return serializer.data

    def export(self, filename: str, queryset) -> tuple[str, Union[str, bytes]]:
        """
        Export queryset to file with configured format.

        Args:
            filename: Base filename (without extension)
            queryset: Django QuerySet to export

        Returns:
            Tuple of (filename_with_extension, content)

        Raises:
            ValueError: If format_type was not provided during initialization
        """
        if not self.formatter:
            raise ValueError("format_type must be provided during initialization to use export() method")

        data = self.serialize(queryset)
        content = self.formatter.encode(data)
        full_filename = f"{filename}.{self.formatter.extension}"

        return full_filename, content

    def to_string(self, queryset, formatter: BaseFormatter) -> Union[str, bytes]:
        """Export to formatted string (legacy interface)"""
        data = self.serialize(queryset)
        return formatter.encode(data)

    def to_file(self, queryset, filepath: str, formatter: BaseFormatter) -> str:
        """Export to file (legacy interface)"""
        content = self.to_string(queryset, formatter)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath

    @classmethod
    def get_available_formats(cls) -> List[str]:
        """Get list of available export formats."""
        return list(cls.FORMATTERS.keys())
