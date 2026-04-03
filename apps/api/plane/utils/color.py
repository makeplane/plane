# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import random
import string


def get_random_color():
    """
    Get a random color in hex format
    """
    return "#" + "".join(random.choices(string.hexdigits, k=6))
