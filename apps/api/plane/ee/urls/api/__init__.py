from .worklog import urlpatterns as worklog_patterns
from .issue_property import urlpatterns as issue_property_patterns
from .workspace import urlpatterns as workspace_patterns
from .job import urlpatterns as job_patterns
from .page import urlpatterns as page_patterns
from .epic import urlpatterns as epic_patterns
from .asset import urlpatterns as asset_patterns

urlpatterns = [
    *worklog_patterns,
    *issue_property_patterns,
    *workspace_patterns,
    *page_patterns,
    *job_patterns,
    *epic_patterns,
    *asset_patterns,
]
