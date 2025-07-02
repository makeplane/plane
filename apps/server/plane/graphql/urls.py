# Django imports
from django.urls import path
from django.conf import settings

# Module imports
from plane.graphql.views import CustomGraphQLView
from plane.graphql.schema import schema

urlpatterns = [
    path("", CustomGraphQLView.as_view(schema=schema, graphiql=settings.DEBUG))
]
