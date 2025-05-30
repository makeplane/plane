from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Q, UUIDField, Value
from django.db.models.functions import Coalesce
from django_elasticsearch_dsl import fields
from django_elasticsearch_dsl.registries import registry

from plane.ee.models import Teamspace, TeamspaceMember

from .base import BaseDocument, JsonKeywordField


@registry.register_document
class TeamspaceDocument(BaseDocument):
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    active_member_user_ids = fields.ListField(fields.KeywordField())
    logo_props = JsonKeywordField(attr="logo_props")
    is_deleted = fields.BooleanField()

    class Index:
        name = "teamspaces"

    class Django:
        model = Teamspace
        fields = ["id", "name", "deleted_at"]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 5000
        related_models = [TeamspaceMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace").annotate(
            active_member_user_ids=Coalesce(
                ArrayAgg(
                    "members__member_id",
                    distinct=True,
                    filter=Q(members__member__is_active=True),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, TeamspaceMember):
            qs = related_instance.team_space.all()
        else:
            qs = self.django.model.objects.none()
        return self.apply_related_to_queryset(qs)

    def prepare_workspace_slug(self, instance):
        """
        Data preparation method for workspace_slug field
        """
        return instance.workspace.slug if instance.workspace else None

    def prepare_active_project_member_user_ids(self, instance):
        """
        Data preparation method for active_project_member_user_ids field
        """
        return instance.active_member_user_ids

    def prepare_is_deleted(self, instance):
        """
        Data preparation method for is_deleted field
        """
        return bool(instance.deleted_at)
