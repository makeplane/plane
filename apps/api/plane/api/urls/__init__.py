from .project import urlpatterns as project_patterns
from .state import urlpatterns as state_patterns
from .issue import urlpatterns as issue_patterns
from .cycle import urlpatterns as cycle_patterns
from .module import urlpatterns as module_patterns
from .intake import urlpatterns as intake_patterns
from .member import urlpatterns as member_patterns
from .asset import urlpatterns as asset_patterns
from .user import urlpatterns as user_patterns

urlpatterns = [
    *asset_patterns,
    *project_patterns,
    *state_patterns,
    *issue_patterns,
    *cycle_patterns,
    *module_patterns,
    *intake_patterns,
    *member_patterns,
    *user_patterns,
]
