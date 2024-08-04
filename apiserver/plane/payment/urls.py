from django.urls import path

from .views import (
    ProductEndpoint,
    PaymentLinkEndpoint,
    WorkspaceProductEndpoint,
    WebsitePaymentLinkEndpoint,
    WebsiteUserWorkspaceEndpoint,
    SubscriptionEndpoint,
    UpgradeSubscriptionEndpoint,
    FeatureFlagProxyEndpoint,
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
    path(
        "website/payment-link/",
        WebsitePaymentLinkEndpoint.as_view(),
        name="website-payment-link",
    ),
    path(
        "website/workspaces/",
        WebsiteUserWorkspaceEndpoint.as_view(),
        name="website-workspaces",
    ),
    path(
        "workspaces/<str:slug>/subscriptions/",
        SubscriptionEndpoint.as_view(),
        name="subscription",
    ),
    path(
        "workspaces/<str:slug>/subscriptions/upgrade/",
        UpgradeSubscriptionEndpoint.as_view(),
        name="subscription",
    ),
    path(
        "workspaces/<str:slug>/feature-flags/",
        FeatureFlagProxyEndpoint.as_view(),
        name="feature-flags",
    ),
]
