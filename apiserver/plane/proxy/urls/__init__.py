from .project import urlpatterns as project_patterns
from .issue import urlpatterns as issue_patterns
from .cycle import urlpatterns as cycle_patterns
from .module import urlpatterns as module_patterns

urlpatterns = [
    *project_patterns,
    *issue_patterns,
    *cycle_patterns,
    *module_patterns,
]
