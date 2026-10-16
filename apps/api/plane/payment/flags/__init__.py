# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .flag import FeatureFlag
from .flag_decorator import check_feature_flag

__all__ = ["FeatureFlag", "check_feature_flag"]
