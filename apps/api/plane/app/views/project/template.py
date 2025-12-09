from rest_framework.response import Response
from rest_framework import status

from plane.app.serializers.template import ProjectTemplateCreateUpdateSerializer
from plane.app.views import BaseAPIView
from plane.db.models import Workspace


class ProjectTemplateAPIView(BaseAPIView):

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ProjectTemplateCreateUpdateSerializer(data={**request.data, 'workspace': workspace})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
