# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.porters.exporter import DataExporter
from plane.utils.porters.formatters import UTF8_SIG_BOM


class FakeIssueSerializer:
    def __init__(self, queryset, many=False, **kwargs):
        self.data = [{"name": "Środki ochrony", "identifier": "AGRO"}]


@pytest.mark.unit
class TestDataExporterCsvDelimiter:
    def test_csv_export_uses_comma_delimiter_by_default(self):
        exporter = DataExporter(FakeIssueSerializer, format_type="csv")
        _, content = exporter.export("issues", [])

        assert isinstance(content, str)
        assert content.startswith(UTF8_SIG_BOM)
        assert "Name,Identifier" in content.replace("\r\n", "\n")
        assert "Środki ochrony" in content

    def test_csv_export_uses_semicolon_delimiter_when_configured(self):
        exporter = DataExporter(FakeIssueSerializer, format_type="csv", csv_delimiter=";")
        _, content = exporter.export("issues", [])

        assert "Name;Identifier" in content.replace("\r\n", "\n")
        assert "Środki ochrony;AGRO" in content.replace("\r\n", "\n")

    def test_invalid_csv_delimiter_falls_back_to_comma(self):
        exporter = DataExporter(FakeIssueSerializer, format_type="csv", csv_delimiter="|")
        _, content = exporter.export("issues", [])

        assert "Name,Identifier" in content.replace("\r\n", "\n")
