from .intake import urlpatterns as intake_patterns
from .page import urlpatterns as page_patterns
from .views import urlpatterns as views_patterns

urlpatterns = [*intake_patterns, *page_patterns, *views_patterns]
