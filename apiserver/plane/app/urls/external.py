from django.urls import path


from plane.app.views import UnsplashEndpoint

urlpatterns = [
    path(
        "unsplash/",
        UnsplashEndpoint.as_view(),
        name="unsplash",
    )
]
