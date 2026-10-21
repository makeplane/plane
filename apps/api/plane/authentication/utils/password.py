# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from zxcvbn import zxcvbn

# Score at most this many characters from each end of the password, so the cost of
# scoring stays bounded. The password is strong if either window is strong.
ZXCVBN_MAX_LENGTH = 128


def is_password_strong(password):
    windows = {password[:ZXCVBN_MAX_LENGTH], password[-ZXCVBN_MAX_LENGTH:]}
    return any(zxcvbn(window)["score"] >= 3 for window in windows)
