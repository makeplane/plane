from django.urls import path

from plane.app.views import (
    CompanyViewSet,
    CompanySettingsView,
    CompanyMemberRoleView,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/companies/",
        CompanyViewSet.as_view(),
        name="workaround-companies",
    ),
    path(
        "workspaces/<str:slug>/companies/<uuid:pk>/",
        CompanyViewSet.as_view(),
        name="workaround-company-detail",
    ),
    path(
        "workspaces/<str:slug>/companies/<uuid:company_pk>/settings/",
        CompanySettingsView.as_view(),
        name="workaround-company-settings",
    ),
    path(
        "workspaces/<str:slug>/companies/<uuid:company_pk>/roles/",
        CompanyMemberRoleView.as_view(),
        name="workaround-company-roles",
    ),
    path(
        "workspaces/<str:slug>/companies/<uuid:company_pk>/roles/<uuid:role_pk>/",
        CompanyMemberRoleView.as_view(),
        name="workaround-company-role-detail",
    ),
]
