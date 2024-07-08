from .ai import urlpatterns as ai_patterns
from .cycle import urlpatterns as cycles_patterns
from .issue import urlpatterns as issue_patterns
from .page import urlpatterns as page_patterns
from .views import urlpatterns as views_patterns

urlpatterns = [
    *ai_patterns,
    *cycles_patterns,
    *issue_patterns,
    *page_patterns,
    *views_patterns,
]
