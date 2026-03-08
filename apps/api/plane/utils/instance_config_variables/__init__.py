# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .core import core_config_variables
from .extended import extended_config_variables

instance_config_variables = [*core_config_variables, *extended_config_variables]
