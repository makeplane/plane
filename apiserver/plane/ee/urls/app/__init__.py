from .ai import urlpatterns as ai_patterns
from .cycle import urlpatterns as cycles_patterns
from .draft import urlpatterns as draft_patterns
from .issue import urlpatterns as issue_patterns
from .page import urlpatterns as page_patterns
from .views import urlpatterns as views_patterns
from .intake import urlpatterns as intake_patterns
from .issue_property import urlpatterns as issue_property_patterns
from .workspace import urlpatterns as workspace_patterns
from .initiative import urlpatterns as initiative_patterns
from .workflow import urlpatterns as workflow_patterns

urlpatterns = [
    *ai_patterns,
    *cycles_patterns,
    *draft_patterns,
    *issue_patterns,
    *page_patterns,
    *views_patterns,
    *intake_patterns,
    *issue_property_patterns,
    *workspace_patterns,
    *initiative_patterns,
    *workflow_patterns,
]
