from django.urls import path

from .views import (
    ProductEndpoint,
    PaymentLinkEndpoint,
    WorkspaceProductEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/products/",
        ProductEndpoint.as_view(),
        name="products",
    ),
    path(
        "workspaces/<str:slug>/current-plan/",
        WorkspaceProductEndpoint.as_view(),
        name="products",
    ),
    path(
        "workspaces/<str:slug>/payment-link/",
        PaymentLinkEndpoint.as_view(),
        name="products",
    ),
]
