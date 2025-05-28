from rest_framework import status
from rest_framework.response import Response

from plane.ee.views.base import BaseAPIView
from plane.ee.models import TemplateCategory
from plane.ee.serializers.app.template import TemplateCategorySerializer


class TemplateCategoryEndpoint(BaseAPIView):
    def get(self, request):
        template_categories = TemplateCategory.objects.all()
        serializer = TemplateCategorySerializer(template_categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
