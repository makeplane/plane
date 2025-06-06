from django.conf import settings
from django.db.models import Prefetch
from django_opensearch_dsl import fields
from django_opensearch_dsl.registries import registry
from plane.db.models import Issue, ProjectMember, Project

from .base import BaseDocument, edge_ngram_analyzer


@registry.register_document
class IssueDocument(BaseDocument):
    description = fields.TextField(attr="description_stripped")
    project_id = fields.KeywordField(attr="project_id")
    project_identifier = fields.TextField(
        analyzer=edge_ngram_analyzer,
        search_analyzer="standard",
        search_quote_analyzer="standard",
    )
    project_archived_at = fields.DateField()
    project_is_archived = fields.BooleanField()
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    type_id = fields.KeywordField(attr="type_id")
    is_epic = fields.BooleanField()
    active_project_member_user_ids = fields.ListField(fields.KeywordField())
    pretty_sequence = fields.TextField()
    is_deleted = fields.BooleanField()
    name = fields.TextField(analyzer=edge_ngram_analyzer, search_analyzer="standard")

    class Index(BaseDocument.Index):
        name = (
            f"{settings.OPENSEARCH_INDEX_PREFIX}_issues"
            if settings.OPENSEARCH_INDEX_PREFIX
            else "issues"
        )

    class Django:
        model = Issue
        fields = ["id", "sequence_id", "priority", "deleted_at"]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 25000
        related_models = [Project, ProjectMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace", "type").prefetch_related(
            "project",
            Prefetch(
                "project__project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True),
                to_attr="active_project_members",
            ),
        )

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, Project):
            qs = related_instance.project_issue(manager="objects").all()
        elif isinstance(related_instance, ProjectMember):
            qs = related_instance.project.project_issue(manager="objects").all()
        else:
            qs = self.django.model.objects.none()
        return self.apply_related_to_queryset(qs)

    def prepare_project_is_archived(self, instance):
        """
        Data preparation method for project_is_archived field
        """
        return bool(instance.project.archived_at) if instance.project else False

    def prepare_project_identifier(self, instance):
        """
        Data preparation method for project_identifier field
        """
        return instance.project.identifier if instance.project else None

    def prepare_project_archived_at(self, instance):
        """
        Data preparation method for project_archived_at field
        """
        return instance.project.archived_at if instance.project else None

    def prepare_workspace_slug(self, instance):
        """
        Data preparation method for workspace_slug field
        """
        return instance.workspace.slug if instance.workspace else None

    def prepare_is_epic(self, instance):
        """
        Data preparation method for is_epic field
        """
        return instance.type.is_epic if instance.type else False

    def prepare_active_project_member_user_ids(self, instance):
        """
        Data preparation method for active_project_member_user_ids field
        """
        if hasattr(instance.project, "active_project_members"):
            members = instance.project.active_project_members
        else:
            members = instance.project.project_projectmember.filter(
                is_active=True
            ).only("member_id")
        return [member.member_id for member in members]

    def prepare_pretty_sequence(self, instance):
        return f"{instance.project.identifier}-{instance.sequence_id}"

    def prepare_is_deleted(self, instance):
        """
        Data preparation method for is_deleted field
        """
        return bool(instance.deleted_at)
