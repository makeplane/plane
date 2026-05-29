from .asset import urlpatterns as asset_patterns
from .cycle import urlpatterns as cycle_patterns
from .intake import urlpatterns as intake_patterns
from .label import urlpatterns as label_patterns
from .member import urlpatterns as member_patterns
from .module import urlpatterns as module_patterns
from .project import urlpatterns as project_patterns
from .state import urlpatterns as state_patterns
from .user import urlpatterns as user_patterns
from .work_item import urlpatterns as work_item_patterns
from .invite import urlpatterns as invite_patterns
from .sticky import urlpatterns as sticky_patterns

urlpatterns = [
    *asset_patterns,
    *cycle_patterns,
    *intake_patterns,
    *label_patterns,
    *member_patterns,
    *module_patterns,
    *project_patterns,
    *state_patterns,
    *user_patterns,
    *work_item_patterns,
    *invite_patterns,
    *sticky_patterns,
]
