from typing import Dict, List
from .formatters import BaseFormatter

class DataExporter:
    """
    Export data using DRF serializers.

    Usage:
        exporter = DataExporter(BookSerializer, exclude=['password'])
        exporter.to_file(queryset, 'books.csv', CSVFormatter())
        csv_string = exporter.to_string(queryset, CSVFormatter())
    """

    def __init__(self, serializer_class, **serializer_kwargs):
        self.serializer_class = serializer_class
        self.serializer_kwargs = serializer_kwargs

    def serialize(self, queryset) -> List[Dict]:
        """QuerySet → list of dicts"""
        serializer = self.serializer_class(
            queryset,
            many=True,
            **self.serializer_kwargs
        )
        return serializer.data

    def to_string(self, queryset, formatter: BaseFormatter) -> str:
        """Export to formatted string"""
        data = self.serialize(queryset)
        return formatter.encode(data)

    def to_file(self, queryset, filepath: str, formatter: BaseFormatter) -> str:
        """Export to file"""
        content = self.to_string(queryset, formatter)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return filepath
