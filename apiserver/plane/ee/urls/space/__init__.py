from .page import urlpatterns as page_patterns
from .views import urlpatterns as views_patterns

urlpatterns = [
    *page_patterns,
    *views_patterns,
]
