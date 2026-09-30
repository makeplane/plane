# Copyright (c) 2023-present Plane Software, Inc. and contributors
# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import IssueSerializer
from plane.utils.issue_relation_mapper import get_inverse_relation


class IssueExportSerializer(IssueSerializer):
    """
    Export-optimized serializer that extends IssueSerializer with human-readable fields.

    Converts UUIDs to readable values for CSV/JSON export. People are written as e-mail
    addresses, the only value that identifies them across projects and installations.
    """

    identifier = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True, default="")
    project_identifier = serializers.CharField(source='project.identifier', read_only=True, default="")
    state_name = serializers.CharField(source='state.name', read_only=True, default="")
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default="")

    issue_type = serializers.SerializerMethodField()
    assignees = serializers.SerializerMethodField()
    parent = serializers.SerializerMethodField()
    labels = serializers.SerializerMethodField()
    cycles = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    estimate = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    relations = serializers.SerializerMethodField()
    subscribers = serializers.SerializerMethodField()
    custom_properties = serializers.SerializerMethodField()

    class Meta(IssueSerializer.Meta):
        fields = [
            "project_name",
            "project_identifier",
            "parent",
            "identifier",
            "sequence_id",
            "name",
            "description_html",
            "issue_type",
            "state_name",
            "priority",
            "assignees",
            "subscribers",
            "created_by_name",
            "start_date",
            "target_date",
            "duration",
            "completed_at",
            "created_at",
            "updated_at",
            "archived_at",
            "estimate",
            "labels",
            "cycles",
            "modules",
            "custom_properties",
            "links",
            "relations",
            "comments",
            "is_draft",
        ]

    def get_identifier(self, obj):
        return f"{obj.project.identifier}-{obj.sequence_id}"

    def get_issue_type(self, obj):
        return obj.type.name if obj.type else ""

    def get_assignees(self, obj):
        # Read through the join model like labels below. Assignments are soft deleted, and the
        # plain m2m joins that table without honouring the flag, so it lists everyone who was
        # ever assigned to the work item rather than who is assigned now.
        return [
            ia.assignee.email
            for ia in obj.issue_assignee.all()
            if ia.deleted_at is None and ia.assignee and ia.assignee.is_active and ia.assignee.email
        ]

    def get_subscribers(self, obj):
        """Return list of subscriber e-mails."""
        return [sub.subscriber.email for sub in obj.issue_subscribers.all() if sub.subscriber and sub.subscriber.email]

    def get_parent(self, obj):
        if not obj.parent:
            return ""
        return f"{obj.parent.project.identifier}-{obj.parent.sequence_id}"

    def get_labels(self, obj):
        return [
            il.label.name
            for il in obj.label_issue.all()
            if il.deleted_at is None
        ]

    def get_cycles(self, obj):
        return [ic.cycle.name for ic in obj.issue_cycle.all()]

    def get_modules(self, obj):
        return [im.module.name for im in obj.issue_module.all()]

    def get_estimate(self, obj):
        """Return estimate point value."""
        if obj.estimate_point:
            return obj.estimate_point.value if hasattr(obj.estimate_point, 'value') else str(obj.estimate_point)
        return ""

    def get_custom_properties(self, obj):
        """Return work item type property values keyed by property title."""
        values = {}
        for row in obj.type_property_values.all():
            if row.deleted_at is not None or not row.property:
                continue
            values[row.property.title] = self._readable_property_value(row)
        return values

    def _readable_property_value(self, row):
        """Member pickers hold user ids; export the e-mails so the value can be resolved back."""
        if row.property.property_type != "member_picker":
            return row.value
        member_emails = self.context.get("member_emails") or {}
        ids = row.value if isinstance(row.value, list) else [row.value]
        return [member_emails.get(str(member_id), str(member_id)) for member_id in ids if member_id]

    def get_links(self, obj):
        """Return list of issue links with titles."""
        return [
            {
                "url": link.url,
                "title": link.title if link.title else link.url,
            }
            for link in obj.issue_link.all()
        ]

    def get_relations(self, obj):
        """
        Return related issues, one entry per relation.

        The database stores a relation once, on the canonical side. The mirror side is
        exported with the inverse type, so "blocked by" on one item reads as "blocking"
        on the other.
        """
        relations = []

        for rel in obj.issue_relation.all():
            if rel.related_issue:
                relations.append({
                    "type": rel.relation_type,
                    "issue": f"{rel.related_issue.project.identifier}-{rel.related_issue.sequence_id}",
                })

        for rel in obj.issue_related.all():
            if rel.issue:
                relations.append({
                    "type": get_inverse_relation(rel.relation_type),
                    "issue": f"{rel.issue.project.identifier}-{rel.issue.sequence_id}",
                })

        return relations

    def get_comments(self, obj):
        """Return list of comments with author and timestamp."""
        return [
            {
                "comment": comment.comment_stripped if hasattr(comment, 'comment_stripped') else comment.comment_html,
                "created_by": comment.actor.full_name if comment.actor else "",
                "created_at": comment.created_at.strftime("%Y-%m-%d %H:%M:%S") if comment.created_at else "",
            }
            for comment in obj.issue_comments.all()
        ]
