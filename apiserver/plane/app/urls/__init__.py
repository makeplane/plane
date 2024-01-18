from .analytic import urlpatterns as analytic_urls
from .asset import urlpatterns as asset_urls
from .authentication import urlpatterns as authentication_urls
from .config import urlpatterns as configuration_urls
from .cycle import urlpatterns as cycle_urls
from .dashboard import urlpatterns as dashboard_urls
from .estimate import urlpatterns as estimate_urls
from .external import urlpatterns as external_urls
from .importer import urlpatterns as importer_urls
from .inbox import urlpatterns as inbox_urls
from .integration import urlpatterns as integration_urls
from .issue import urlpatterns as issue_urls
from .module import urlpatterns as module_urls
from .notification import urlpatterns as notification_urls
from .page import urlpatterns as page_urls
from .project import urlpatterns as project_urls
from .search import urlpatterns as search_urls
from .state import urlpatterns as state_urls
from .user import urlpatterns as user_urls
from .views import urlpatterns as view_urls
from .workspace import urlpatterns as workspace_urls
from .api import urlpatterns as api_urls
from .webhook import urlpatterns as webhook_urls


urlpatterns = [
    *analytic_urls,
    *asset_urls,
    *authentication_urls,
    *configuration_urls,
    *cycle_urls,
    *dashboard_urls,
    *estimate_urls,
    *external_urls,
    *importer_urls,
    *inbox_urls,
    *integration_urls,
    *issue_urls,
    *module_urls,
    *notification_urls,
    *page_urls,
    *project_urls,
    *search_urls,
    *state_urls,
    *user_urls,
    *view_urls,
    *workspace_urls,
    *api_urls,
    *webhook_urls,
]
