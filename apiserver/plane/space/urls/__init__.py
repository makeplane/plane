from .intake import urlpatterns as intake_urls
from .issue import urlpatterns as issue_urls
from .project import urlpatterns as project_urls


urlpatterns = [
    *intake_urls,
    *issue_urls,
    *project_urls,
]
