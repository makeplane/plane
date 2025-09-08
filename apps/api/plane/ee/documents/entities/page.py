from django.conf import settings as django_settings
from django.db.models import Prefetch
from django_opensearch_dsl import fields
from django_opensearch_dsl.registries import registry

from plane.db.models import Page, Project, WorkspaceMember, ProjectMember

from ..core import BaseDocument, edge_ngram_analyzer
from ..core.fields import JsonKeywordField, KnnVectorField


@registry.register_document
class PageDocument(BaseDocument):
    description = fields.TextField(
        attr="description_stripped",
        fields={"keyword": fields.KeywordField(ignore_above=1024)},
    )
    project_ids = fields.ListField(fields.KeywordField())
    project_identifiers = fields.ListField(fields.KeywordField())
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    active_member_user_ids = fields.ListField(fields.KeywordField())
    logo_props = JsonKeywordField(attr="logo_props")
    is_deleted = fields.BooleanField()
    name = fields.TextField(
        analyzer=edge_ngram_analyzer,
        search_analyzer="standard",
        fields={"keyword": fields.KeywordField(ignore_above=1024)},
    )
    access = fields.IntegerField(attr="access")
    owned_by_id = fields.KeywordField(attr="owned_by_id")
    archived_at = fields.DateField(attr="archived_at")
    is_locked = fields.BooleanField(attr="is_locked")
    is_global = fields.BooleanField(attr="is_global")
    parent_id = fields.KeywordField(attr="parent_id")

    # KNN Vector fields for semantic search
    description_semantic = KnnVectorField(
        dimension=1536,
        method={
            "name": "hnsw",
            "engine": "lucene",
            "space_type": "cosinesimil",
            "parameters": {"m": 16, "ef_construction": 512},
        },
    )

    name_semantic = KnnVectorField(
        dimension=1536,
        method={
            "name": "hnsw",
            "engine": "lucene",
            "space_type": "cosinesimil",
            "parameters": {"m": 16, "ef_construction": 512},
        },
    )

    class Index(BaseDocument.Index):
        # Enable KNN for the index
        settings = {
            **BaseDocument.Index.settings,
            "index": {"knn": True},
        }
        name = (
            f"{django_settings.OPENSEARCH_INDEX_PREFIX}_pages"
            if django_settings.OPENSEARCH_INDEX_PREFIX
            else "pages"
        )

    class Django:
        model = Page
        fields = ["id", "deleted_at"]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 5000
        related_models = [WorkspaceMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace").prefetch_related(
            Prefetch(
                "projects", queryset=Project.objects.filter(archived_at__isnull=True)
            ),
            Prefetch(
                "workspace__workspace_member",
                queryset=WorkspaceMember.objects.filter(is_active=True),
                to_attr="workspace_members",
            ),
            Prefetch(
                "projects__project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True),
                to_attr="project_members",
            ),
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
        if instance.projects.count() > 0:
            project_member_ids = []
            for project in instance.projects.all():
                if hasattr(project, "project_members"):
                    project_member_ids.extend(
                        [member.member_id for member in project.project_members]
                    )
                else:
                    project_member_ids.extend(
                        [
                            member.member_id
                            for member in project.project_projectmember.all()
                        ]
                    )
            return project_member_ids
        else:
            if hasattr(instance.workspace, "workspace_members"):
                return [
                    member.member_id for member in instance.workspace.workspace_members
                ]
            else:
                return [
                    member.member_id
                    for member in instance.workspace.workspace_member.all()
                ]

    def prepare_is_deleted(self, instance):
        """
        Data preparation method for is_deleted field
        """
        return bool(instance.deleted_at)

    def prepare(self, instance):
        """
        Override prepare method to handle semantic field exclusion for partial updates.

        Action context determines field inclusion:
        - index: Include all fields (full reindex)
        - update: Exclude semantic fields (preserve existing embeddings)
        """
        data = super().prepare(instance)

        # For update actions, exclude semantic fields to preserve existing embeddings
        # The _prepare_action method in BaseDocument sets _semantic_fields_changed = False for updates
        semantic_fields_changed = getattr(instance, "_semantic_fields_changed", None)

        # Exclude semantic fields for partial updates (semantic_fields_changed = False)
        if semantic_fields_changed is False:
            semantic_fields = ["description_semantic", "name_semantic"]
            for field in semantic_fields:
                data.pop(field, None)

        return data
