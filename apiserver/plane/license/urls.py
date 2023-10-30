from django.urls import path

from plane.license.api.views import ProductEndpoint, CheckoutEndpoint, InstanceEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/products/",
        ProductEndpoint.as_view(),
        name="products",
    ),
    path(
        "workspaces/<str:slug>/create-checkout-session/",
        CheckoutEndpoint.as_view(),
        name="checkout",
    ),
    path(
        "instances/",
        InstanceEndpoint.as_view(),
        name="instance",
    ),
]
