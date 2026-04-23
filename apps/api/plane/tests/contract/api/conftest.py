# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Re-export role-matrix fixture so contract tests in this directory get it
# automatically via pytest's conftest auto-discovery.
from plane.tests.contract.api.conftest_role_matrix import (  # noqa: F401
    ALL_ROLES,
    RoleMatrix,
    _enable_feature_flags,
    role_matrix,
)
