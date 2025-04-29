# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import FileAsset


class WorkspaceBulkAssetEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, entity_id):
        asset_ids = request.data.get("asset_ids", [])

        if not asset_ids:
            return Response(
                {"error": "No asset ids provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        assets = FileAsset.objects.filter(id__in=asset_ids, workspace__slug=slug)

        asset = assets.first()

        if not asset:
            return Response(
                {"error": "The requested asset could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            assets.update(entity_identifier=entity_id)
        except IntegrityError:
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)
