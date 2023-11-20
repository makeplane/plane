from .inbox import urlpatterns as inbox_urls
from .issue import urlpatterns as issue_urls
from .project import urlpatterns as project_urls


urlpatterns = [
    *inbox_urls,
    *issue_urls,
    *project_urls,
]
