# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited

from pydantic import BaseModel

class ExecutionSummaryRecord(BaseModel):
    total: int = 0
    pulled: int = 0
    created: int = 0
    already_existed: int = 0
    errors: int = 0
