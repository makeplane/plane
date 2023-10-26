from .cycle import urlpatterns as cycle_patterns
from .inbox import urlpatterns as inbox_patterns
from .issue import urlpatterns as issue_patterns
from .module import urlpatterns as module_patterns
from .project import urlpatterns as project_patterns

urlpatterns = [
    *cycle_patterns,
    *inbox_patterns,
    *issue_patterns,
    *module_patterns,
    *project_patterns,
]
