from .project import urlpatterns as project_patterns
from .state import urlpatterns as state_patterns
from .issue import urlpatterns as issue_patterns
from .cycle import urlpatterns as cycle_patterns
from .module import urlpatterns as module_patterns
from .intake import urlpatterns as intake_patterns
from .member import urlpatterns as member_patterns
from .issue_type import urlpatterns as issue_type_patterns
# ee imports
from plane.ee.urls.api.issue_property import urlpatterns as ee_issue_property_patterns

urlpatterns = [
    *project_patterns,
    *state_patterns,
    *issue_patterns,
    *cycle_patterns,
    *module_patterns,
    *intake_patterns,
    *member_patterns,
    *issue_type_patterns,
    *ee_issue_property_patterns,
]
