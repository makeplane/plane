from django.urls import path

from .views import (
    PublishedApplicationEndpoint,
    PublishedApplicationBySlugEndpoint,
    ApplicationCategoryEndpoint,
    TemplateCategoryEndpoint,
    PublishedTemplateEndpoint,
    PublishedTemplateMetaEndpoint,
    PublishedApplicationMetaEndpoint,
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
        "published-applications/<str:slug>/",
        PublishedApplicationBySlugEndpoint.as_view(),
        name="published-application-detail-by-slug",
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
        "published-templates/<str:short_id>/",
        PublishedTemplateEndpoint.as_view(),
        name="published-template-detail-by-short-id",
    ),
    path(
        "published-templates/<str:short_id>/meta/",
        PublishedTemplateMetaEndpoint.as_view(),
        name="published-template-meta-by-short-id",
    ),
    path(
        "published-applications/<str:slug>/meta/",
        PublishedApplicationMetaEndpoint.as_view(),
        name="published-application-meta",
    ),
]
