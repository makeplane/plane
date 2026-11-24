# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.utils.paginator import MAX_LIMIT


def positive_int_param(request, name, default, max_value=MAX_LIMIT):
    """Read a whole number query parameter between 1 and ``max_value``.

    A missing value gives ``default``. Anything else that is not a whole number
    in that range, an empty value included, raises ``ParseError``, which the
    views answer with HTTP 400, as the paginator does for ``per_page``.
    """
    value = request.query_params.get(name)
    if value is None:
        return default
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ParseError(detail=f"Invalid {name} parameter.")
    if number < 1:
        raise ParseError(detail=f"Invalid {name} value. Must be greater than zero.")
    if number > max_value:
        raise ParseError(detail=f"Invalid {name} value. Cannot exceed {max_value}.")
    return number
