from django.urls import path

from .views import (
    PublishedApplicationEndpoint,
    ApplicationCategoryEndpoint,
    TemplateCategoryEndpoint,
    PublishedTemplateEndpoint,
    PublishedTemplateMetaEndpoint,
)


urlpatterns = [
    path(
        "published-applications/",
        PublishedApplicationEndpoint.as_view(),
        name="published-application",
    ),
    path(
        "published-applications/<uuid:pk>/",
        PublishedApplicationEndpoint.as_view(),
        name="published-application-detail",
    ),
    path(
        "application-categories/",
        ApplicationCategoryEndpoint.as_view(),
        name="application-categories",
    ),
    path(
        "template-categories/",
        TemplateCategoryEndpoint.as_view(),
        name="template-categories",
    ),
    path(
        "published-templates/",
        PublishedTemplateEndpoint.as_view(),
        name="published-templates",
    ),
    path(
        "published-templates/<uuid:pk>/",
        PublishedTemplateEndpoint.as_view(),
        name="published-template-detail",
    ),
    path(
        "published-templates/<uuid:pk>/meta/",
        PublishedTemplateMetaEndpoint.as_view(),
        name="published-template-meta",
    ),
]
