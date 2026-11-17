# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.db.models import Case, FloatField, When
from django.db.models.functions import Cast

# A plain non-negative decimal: no sign, exponent, nan/inf, hex or underscore. ASCII classes
# only, so Python float() and Postgres CAST(text AS double precision) read every match alike.
NUMERIC_ESTIMATE_PATTERN = r" *([0-9]+\.?[0-9]*|\.[0-9]+) *"

NON_NUMERIC_ESTIMATE_ERROR = "Value must be a number for a points estimate"


def is_numeric_estimate(value) -> bool:
    # str() mirrors what the CharField column stores for a non-string payload value
    return re.fullmatch(NUMERIC_ESTIMATE_PATTERN, str(value)) is not None


def estimate_to_float(value) -> float:
    """Estimate point value as a number; anything that is not numeric (e.g. "M = 2") counts as 0."""
    return float(value) if is_numeric_estimate(value) else 0.0


def estimate_value_as_float():
    """SQL twin of estimate_to_float for Issue querysets: non-numeric text is NULL, which Sum skips."""
    return Case(
        When(
            estimate_point__value__regex=f"^{NUMERIC_ESTIMATE_PATTERN}$",
            then=Cast("estimate_point__value", FloatField()),
        ),
        output_field=FloatField(),
    )
