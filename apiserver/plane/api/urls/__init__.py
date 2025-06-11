from .project import urlpatterns as project_patterns
from .state import urlpatterns as state_patterns
from .issue import urlpatterns as issue_patterns
from .cycle import urlpatterns as cycle_patterns
from .module import urlpatterns as module_patterns
from .intake import urlpatterns as intake_patterns
from .member import urlpatterns as member_patterns
from .user import urlpatterns as user_patterns
from .asset import urlpatterns as asset_patterns
from .issue_type import urlpatterns as issue_type_patterns
from .page import urlpatterns as page_patterns

# ee imports
from plane.ee.urls.api import urlpatterns as ee_api_urls

urlpatterns = [
    *project_patterns,
    *state_patterns,
    *issue_patterns,
    *cycle_patterns,
    *module_patterns,
    *user_patterns,
    *intake_patterns,
    *member_patterns,
    *issue_type_patterns,
    *asset_patterns,
    *ee_api_urls,
    *page_patterns,
]
