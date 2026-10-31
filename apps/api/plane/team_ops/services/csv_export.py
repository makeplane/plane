# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import codecs
import csv
import io

# Django imports
from django.http import HttpResponse

# Written first so that Excel reads the UTF-8 names correctly.
BOM = codecs.BOM_UTF8.decode("utf-8")

# Characters that make a spreadsheet read a cell as a formula.
_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def csv_safe(value):
    """A cell value that a spreadsheet will show as text, even when a person's name starts with `=`."""
    if isinstance(value, str) and value.startswith(_FORMULA_PREFIXES):
        return "'" + value
    return value


def hours(seconds):
    """Seconds as decimal hours with two places, e.g. `7.50`."""
    return f"{seconds / 3600:.2f}"


def csv_response(filename, header, rows, notice):
    """A downloadable CSV. The notice is the last row, after a blank one, so the header stays on line one.

    Text that comes from people (names, emails, notes) must go through `csv_safe` before it is put
    in a row; numbers are written as they are.

    The byte-order mark comes first.
    """
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    writer.writerows(rows)
    writer.writerow([])
    writer.writerow([notice])

    response = HttpResponse(BOM + buffer.getvalue(), content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
