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

from plane.agents.models import AgentRun, AgentRunActivity
from plane.app.serializers.base import BaseSerializer


class AgentRunSerializer(BaseSerializer):
    # not much verification required as this will be triggered from web
    class Meta:
        model = AgentRun
        fields = "__all__"


class AgentRunActivitySerializer(BaseSerializer):
    class Meta:
        model = AgentRunActivity
        fields = "__all__"
