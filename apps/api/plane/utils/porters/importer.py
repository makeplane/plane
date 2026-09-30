# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from typing import Dict, List, Union

from .formatters import BaseFormatter, CSVFormatter, JSONFormatter, XLSXFormatter


class DataImporter:
    FORMATTERS = {
        "csv": CSVFormatter,
        "json": JSONFormatter,
        "xlsx": XLSXFormatter,
    }

    def __init__(self, format_type: str = "csv"):
        if format_type not in self.FORMATTERS:
            raise ValueError(f"Unsupported format: {format_type}. Available: {list(self.FORMATTERS.keys())}")
        formatter_class = self.FORMATTERS[format_type]
        self.formatter = formatter_class() if format_type != "xlsx" else formatter_class(list_joiner=", ")
        self.format_type = format_type

    def decode(self, content: Union[str, bytes]) -> List[Dict]:
        if self.format_type == "xlsx":
            if isinstance(content, str):
                content = content.encode("utf-8")
            return self.formatter.decode(content)
        if isinstance(content, bytes):
            content = content.decode("utf-8-sig")
        return self.formatter.decode(content)
