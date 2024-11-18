from .intake import urlpatterns as intake_urls
from .issue import urlpatterns as issue_urls
from .project import urlpatterns as project_urls
from .asset import urlpatterns as asset_urls

from plane.ee.urls.space import urlpatterns as ee_space_urls

urlpatterns = [
    *intake_urls,
    *issue_urls,
    *project_urls,
    *asset_urls,
    # Include EE urls
    *ee_space_urls,
]
