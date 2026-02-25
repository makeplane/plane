# [FA-CUSTOM] CSV/XLSX file parser for import
import csv
import io
from typing import List, Tuple

import openpyxl


def parse_import_file(
    file, file_format: str
) -> Tuple[List[str], List[List[str]]]:
    """
    Parse an uploaded file and return (headers, rows).
    All values are converted to strings.
    Rows are lists of string values aligned with headers.
    """
    if file_format == "csv":
        return _parse_csv(file)
    elif file_format == "xlsx":
        return _parse_xlsx(file)
    else:
        raise ValueError(f"Unsupported format: {file_format}")


def _parse_csv(file) -> Tuple[List[str], List[List[str]]]:
    content = file.read()
    # Try UTF-8 first (with BOM support), then latin-1
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.reader(io.StringIO(text))
    all_rows = list(reader)

    if not all_rows:
        raise ValueError("File is empty")

    headers = [h.strip() for h in all_rows[0]]
    if not any(headers):
        raise ValueError("No column headers found in the first row")

    rows = []
    for row in all_rows[1:]:
        # Skip completely empty rows
        if not any(cell.strip() for cell in row):
            continue
        # Pad short rows, truncate long rows to match header count
        padded = row + [""] * max(0, len(headers) - len(row))
        rows.append([str(v).strip() for v in padded[: len(headers)]])

    return headers, rows


def _parse_xlsx(file) -> Tuple[List[str], List[List[str]]]:
    wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
    ws = wb.active

    all_rows = list(ws.iter_rows(values_only=True))
    wb.close()

    if not all_rows:
        raise ValueError("File is empty")

    headers = [
        str(h).strip() if h is not None else f"Column_{i}"
        for i, h in enumerate(all_rows[0])
    ]
    if not any(h for h in headers if not h.startswith("Column_")):
        raise ValueError("No column headers found in the first row")

    rows = []
    for row in all_rows[1:]:
        # Skip completely empty rows
        if not any(cell is not None and str(cell).strip() for cell in row):
            continue
        padded = list(row) + [None] * max(0, len(headers) - len(row))
        rows.append(
            [
                str(v).strip() if v is not None else ""
                for v in padded[: len(headers)]
            ]
        )

    return headers, rows
