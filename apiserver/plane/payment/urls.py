from django.urls import path

from .views import (
    ProductEndpoint,
    PaymentLinkEndpoint,
    WorkspaceProductEndpoint,
    WebsitePaymentLinkEndpoint,
    WebsiteUserWorkspaceEndpoint,
    SubscriptionEndpoint,
    WorkspaceLicenseEndpoint,
    UpgradeSubscriptionEndpoint,
    FeatureFlagProxyEndpoint,
    WorkspaceLicenseRefreshEndpoint,
    WorkspaceLicenseSyncEndpoint,
    WorkspaceFreeTrialEndpoint,
    WorkspaceTrialUpgradeEndpoint,
    PurchaseSubscriptionSeatEndpoint,
    RemoveUnusedSeatsEndpoint,
    LicenseDeActivateEndpoint,
    ProrationPreviewEndpoint,
)

urlpatterns = [
    path("workspaces/<str:slug>/products/", ProductEndpoint.as_view(), name="products"),
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
        "workspaces/<str:slug>/licenses/",
        WorkspaceLicenseEndpoint.as_view(),
        name="license-activate",
    ),
    path(
        "workspaces/<str:slug>/subscriptions/upgrade/",
        UpgradeSubscriptionEndpoint.as_view(),
        name="subscription",
    ),
    path(
        "workspaces/<str:slug>/flags/", FeatureFlagProxyEndpoint.as_view(), name="flags"
    ),
    path(
        "workspaces/<str:slug>/license-refresh/",
        WorkspaceLicenseRefreshEndpoint.as_view(),
        name="license-refresh",
    ),
    path(
        "workspaces/license-sync/",
        WorkspaceLicenseSyncEndpoint.as_view(),
        name="license-sync",
    ),
    path(
        "workspaces/<str:slug>/trial-subscriptions/",
        WorkspaceFreeTrialEndpoint.as_view(),
        name="trial-subscriptions",
    ),
    path(
        "workspaces/<str:slug>/trial-subscriptions/upgrade/",
        WorkspaceTrialUpgradeEndpoint.as_view(),
        name="trial-upgrade",
    ),
    path(
        "workspaces/<str:slug>/subscriptions/seats/",
        PurchaseSubscriptionSeatEndpoint.as_view(),
        name="purchase-subscription-seats",
    ),
    path(
        "workspaces/<str:slug>/subscriptions/seats/remove-unused/",
        RemoveUnusedSeatsEndpoint.as_view(),
        name="remove-unused-seats",
    ),
    path(
        "workspaces/<str:slug>/licenses/deactivate/",
        LicenseDeActivateEndpoint.as_view(),
        name="license-deactivate",
    ),
    path(
        "workspaces/<str:slug>/subscriptions/proration-preview/",
        ProrationPreviewEndpoint.as_view(),
        name="proration-preview",
    ),
]
