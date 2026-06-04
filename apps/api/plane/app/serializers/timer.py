# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import IssueTimer, IssueTimerSegment


class IssueTimerSegmentSerializer(serializers.ModelSerializer):
    """Serializes individual timer segments (start/end pairs)."""

    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = IssueTimerSegment
        fields = [
            "id",
            "segment_start",
            "segment_end",
            "duration_seconds",
        ]
        read_only_fields = fields

    def get_duration_seconds(self, obj):
        if obj.segment_end:
            return int((obj.segment_end - obj.segment_start).total_seconds())
        from django.utils import timezone

        return int((timezone.now() - obj.segment_start).total_seconds())


class IssueTimerSerializer(serializers.ModelSerializer):
    """
    Member-facing serializer for timer state + computed info.
    Used in GET responses and timer action responses.
    """

    segments = IssueTimerSegmentSerializer(many=True, read_only=True)
    user_display_name = serializers.SerializerMethodField()
    issue_identifier = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()
    computed_duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = IssueTimer
        fields = [
            "id",
            "issue_id",
            "issue_identifier",
            "user_id",
            "user_display_name",
            "workspace_id",
            "project_id",
            "started_at",
            "paused_at",
            "stopped_at",
            "total_duration_seconds",
            "computed_duration_seconds",
            "duration_display",
            "is_running",
            "is_paused",
            "is_manual",
            "note",
            "segments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_user_display_name(self, obj):
        if obj.user:
            return obj.user.display_name or obj.user.email
        return ""

    def get_issue_identifier(self, obj):
        try:
            issue = obj.issue
            project = issue.project
            return f"{project.identifier}-{issue.sequence_id}"
        except Exception:
            return ""

    def get_duration_display(self, obj):
        secs = self.get_computed_duration_seconds(obj)
        hours = secs // 3600
        minutes = (secs % 3600) // 60
        seconds = secs % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def get_computed_duration_seconds(self, obj):
        """
        For running timers, recompute from segments to include current
        live time. For stopped timers, use the cached total.
        """
        if obj.is_running or obj.is_paused:
            return obj.compute_duration()
        return obj.total_duration_seconds


class IssueTimerAdminSerializer(IssueTimerSerializer):
    """
    Admin-facing serializer with additional project/workspace context.
    """

    project_name = serializers.SerializerMethodField()
    issue_name = serializers.SerializerMethodField()

    class Meta(IssueTimerSerializer.Meta):
        fields = IssueTimerSerializer.Meta.fields + [
            "project_name",
            "issue_name",
        ]
        read_only_fields = fields

    def get_project_name(self, obj):
        try:
            return obj.project.name
        except Exception:
            return ""

    def get_issue_name(self, obj):
        try:
            return obj.issue.name
        except Exception:
            return ""


class ActiveTimerSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the active timers endpoint.
    Returns minimal info for badge display in issue lists.
    """

    user_display_name = serializers.SerializerMethodField()
    issue_title = serializers.SerializerMethodField()
    user_avatar_url = serializers.SerializerMethodField()
    last_segment_start = serializers.SerializerMethodField()

    class Meta:
        model = IssueTimer
        fields = [
            "issue_id",
            "user_id",
            "user_display_name",
            "issue_title",
            "user_avatar_url",
            "total_duration_seconds",
            "last_segment_start",
        ]
        read_only_fields = fields

    def get_user_display_name(self, obj):
        if obj.user:
            return obj.user.display_name or obj.user.email
        return ""

    def get_issue_title(self, obj):
        try:
            return obj.issue.name
        except Exception:
            return ""

    def get_user_avatar_url(self, obj):
        if obj.user:
            return getattr(obj.user, 'avatar_url', '') or getattr(obj.user, 'avatar', '')
        return ""

    def get_last_segment_start(self, obj):
        last_seg = obj.segments.filter(segment_end__isnull=True).last()
        return last_seg.segment_start if last_seg else obj.started_at
