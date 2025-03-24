
from django.db.models import Prefetch
from django_elasticsearch_dsl import fields
from django_elasticsearch_dsl.registries import registry
from plane.db.models import Workspace, WorkspaceMember

from .base import BaseDocument


@registry.register_document
class WorkspaceDocument(BaseDocument):
    slug = fields.KeywordField(attr="slug")
    active_member_user_ids = fields.ListField(fields.KeywordField())
    is_deleted = fields.BooleanField()
    class Index:
        name = "workspaces"

    class Django:
        model = Workspace
        fields = [
            "id", "name", "deleted_at"
        ]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 10000
        related_models = [WorkspaceMember]

    def apply_related_to_queryset(self, qs):
        return qs.prefetch_related(
            Prefetch(
                "workspace_member",
                queryset=WorkspaceMember.objects.filter(is_active=True).only("member_id"),
                to_attr="active_members"
            )
        )

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, WorkspaceMember):
            qs = Workspace.objects.filter(id=related_instance.workspace_id)
        else:
            qs = self.django.model.objects.none()
        return self.apply_related_to_queryset(qs)

    def prepare_active_member_user_ids(self, instance):
        """
        Data preparation method for active_member_user_ids field
        """
        if hasattr(instance, "active_members"):
            members = instance.active_members
        else:
            members = instance.workspace_member.filter(is_active=True).only("member_id")
        return [member.member_id for member in members]

    def prepare_is_deleted(self, instance):
        """
        Data preparation method for is_deleted field
        """
        return bool(instance.deleted_at)
