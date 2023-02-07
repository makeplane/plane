# Module imports
from plane.api.serializers import BaseSerializer
from plane.db.models import GithubIssueSync, GithubRepository, GithubRepositorySync


class GithubRepositorySerializer(BaseSerializer):
    class Meta:
        model = GithubRepository
        fields = "__all__"


class GithubRepositorySyncSerializer(BaseSerializer):
    class Meta:
        model = GithubRepositorySync
        fields = "__all__"


class GithubIssueSyncSerializer(BaseSerializer):
    class Meta:
        model = GithubIssueSync
        fields = "__all__"
