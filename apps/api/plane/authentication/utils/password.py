# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from zxcvbn import zxcvbn

# zxcvbn's cost grows superlinearly with input length, so only a bounded prefix is scored.
ZXCVBN_MAX_LENGTH = 128


def is_password_strong(password):
    return zxcvbn(password[:ZXCVBN_MAX_LENGTH])["score"] >= 3
