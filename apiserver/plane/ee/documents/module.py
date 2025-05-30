from django.db.models import Prefetch
from django_elasticsearch_dsl import fields
from django_elasticsearch_dsl.registries import registry

from plane.db.models import Module, Project, ProjectMember

from .base import BaseDocument, JsonKeywordField


@registry.register_document
class ModuleDocument(BaseDocument):
    project_id = fields.KeywordField(attr="project_id")
    project_identifier = fields.TextField()
    project_archived_at = fields.DateField()
    project_is_archived = fields.BooleanField()
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    active_project_member_user_ids = fields.ListField(fields.KeywordField())
    logo_props = JsonKeywordField(attr="logo_props")
    is_deleted = fields.BooleanField()

    class Index:
        name = "modules"

    class Django:
        model = Module
        fields = ["id", "name", "description", "deleted_at"]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 5000
        related_models = [Project, ProjectMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace").prefetch_related(
            "project",
            Prefetch(
                "project__project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True).only("member_id"),
                to_attr="active_project_members",
            ),
        )

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, Project):
            qs = related_instance.project_module.all()
        elif isinstance(related_instance, ProjectMember):
            qs = related_instance.project.project_module.all()
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

    def prepare_is_deleted(self, instance):
        """
        Data preparation method for is_deleted field
        """
        return bool(instance.deleted_at)
