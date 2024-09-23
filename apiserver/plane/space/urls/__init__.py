from .inbox import urlpatterns as inbox_urls
from .issue import urlpatterns as issue_urls
from .project import urlpatterns as project_urls

from plane.ee.urls.space import urlpatterns as ee_space_urls

urlpatterns = [
    *inbox_urls,
    *issue_urls,
    *project_urls,
    # Include EE urls
    *ee_space_urls,
]
