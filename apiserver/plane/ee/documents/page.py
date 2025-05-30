
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Q,
    UUIDField,
    Value,
    Prefetch
)
from django.db.models.functions import Coalesce
from django_elasticsearch_dsl import fields
from django_elasticsearch_dsl.registries import registry

from plane.db.models import Page, Project, WorkspaceMember

from .base import BaseDocument, JsonKeywordField


@registry.register_document
class PageDocument(BaseDocument):
    description = fields.TextField(attr="description_stripped")
    project_ids = fields.ListField(fields.KeywordField())
    project_identifiers = fields.ListField(fields.KeywordField())
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    active_member_user_ids = fields.ListField(fields.KeywordField())
    logo_props = JsonKeywordField(attr="logo_props")
    is_deleted = fields.BooleanField()
    class Index:
        name = "pages"

    class Django:
        model = Page
        fields = [
            "id", "name", "deleted_at"
        ]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 5000
        related_models = [WorkspaceMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related(
            "workspace"
        ).prefetch_related(
            Prefetch(
                "projects",
                queryset=Project.objects.filter(
                    archived_at__isnull=True
                ).only('id', 'identifier')
            )
        ).annotate(
            active_member_user_ids=Coalesce(
                ArrayAgg(
                    "workspace__workspace_member__member_id",
                    distinct=True,
                    filter=Q(workspace__workspace_member__is_active=True)
                ),
                Value([], output_field=ArrayField(UUIDField())),
            )
        )

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, WorkspaceMember):
            qs = Page.objects.filter(workspace__workspace_member=related_instance)
        else:
            qs = self.django.model.objects.none()
        return self.apply_related_to_queryset(qs)

    def prepare_project_ids(self, instance):
        """
        Data preparation method for project_ids field
        """
        return [project.id for project in instance.projects.all()]

    def prepare_project_identifiers(self, instance):
        """
        Data preparation method for project_identifiers field
        """
        return [project.identifier for project in instance.projects.all()]

    def prepare_workspace_slug(self, instance):
        """
        Data preparation method for workspace_slug field
        """
        return instance.workspace.slug if instance.workspace else None

    def prepare_active_member_user_ids(self, instance):
        """
        Data preparation method for active_member_user_ids field
        """
        if hasattr(instance, "active_member_user_ids"):
            return instance.active_member_user_ids
        else:
            active_member_user_ids = instance.workspace.workspace_member.filter(
                is_active=True
            ).values_list('member_id')
            return list(active_member_user_ids)

    def prepare_is_deleted(self, instance):
        """
        Data preparation method for is_deleted field
        """
        return bool(instance.deleted_at)
