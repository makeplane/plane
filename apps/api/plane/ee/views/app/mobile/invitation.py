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

# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.ee.serializers import MobileInvitationDetailsSerializer
from plane.db.models import WorkspaceMemberInvite


# mobile workspace invitation endpoint
class MobileWorkspaceInvitationEndpoint(APIView):
    use_read_replica = True

    permission_classes = [AllowAny]

    def get(self, request, invitation_id, email):
        serializer_class = MobileInvitationDetailsSerializer
        model = WorkspaceMemberInvite

        try:
            workspace_invitation = model.objects.get(id=invitation_id, email=email, responded_at__isnull=True)

            if workspace_invitation.accepted:
                return Response({"error": "Invitation already accepted"}, status=400)

            serializer = serializer_class(workspace_invitation)
            return Response(serializer.data, status=200)
        except model.DoesNotExist:
            return Response({"error": "Invalid invitation id"}, status=400)
        except Exception:
            return Response({"error": "Invalid invitation id"}, status=400)
