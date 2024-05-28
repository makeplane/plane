from django.urls import path

from .views import ProductEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/products/",
        ProductEndpoint.as_view(),
        name="products",
    ),
]
