from .worklog import urlpatterns as worklog_patterns
from .issue_property import urlpatterns as issue_property_patterns
from .workspace import urlpatterns as workspace_patterns
from .job import urlpatterns as job_patterns


urlpatterns = [
    *worklog_patterns,
    *issue_property_patterns,
    *workspace_patterns,
    *job_patterns,
]
