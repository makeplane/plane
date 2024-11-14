from .project import urlpatterns as project_patterns
from .state import urlpatterns as state_patterns
from .issue import urlpatterns as issue_patterns
from .issue_type import urlpatterns as issue_type_patterns
from .cycle import urlpatterns as cycle_patterns
from .module import urlpatterns as module_patterns
from .inbox import urlpatterns as inbox_patterns
from .member import urlpatterns as member_patterns
from plane.app.urls.search import urlpatterns as search_patters

urlpatterns = [
    *project_patterns,
    *state_patterns,
    *issue_patterns,
    *cycle_patterns,
    *module_patterns,
    *inbox_patterns,
    *member_patterns,
    *issue_type_patterns,
    *search_patters
]
