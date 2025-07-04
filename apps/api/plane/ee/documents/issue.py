from django.conf import settings as django_settings
from django.db.models import Prefetch
from django_opensearch_dsl import fields
from django_opensearch_dsl.registries import registry
from plane.db.models import (
    Issue,
    ProjectMember,
    Project,
    IssueComment,
    IssueRelation,
)
from plane.db.models.issue import IssueRelationChoices

from .base import BaseDocument, KnnVectorField, edge_ngram_analyzer


@registry.register_document
class IssueDocument(BaseDocument):
    description = fields.TextField(
        attr="description_stripped",
        fields={"keyword": fields.KeywordField()},
    )
    project_id = fields.KeywordField(attr="project_id")
    project_identifier = fields.TextField(
        analyzer=edge_ngram_analyzer,
        search_analyzer="standard",
        search_quote_analyzer="standard",
        fields={"keyword": fields.KeywordField()},
    )
    project_archived_at = fields.DateField()
    project_is_archived = fields.BooleanField()
    workspace_id = fields.KeywordField(attr="workspace_id")
    workspace_slug = fields.KeywordField()
    type_id = fields.KeywordField(attr="type_id")
    is_epic = fields.BooleanField()
    active_project_member_user_ids = fields.ListField(fields.KeywordField())
    pretty_sequence = fields.TextField(fields={"keyword": fields.KeywordField()})
    is_deleted = fields.BooleanField()
    name = fields.TextField(
        analyzer=edge_ngram_analyzer,
        search_analyzer="standard",
        fields={"keyword": fields.KeywordField()},
    )
    duplicate_of = fields.ListField(fields.KeywordField())
    not_duplicates_with = fields.ListField(fields.KeywordField())

    # KNN Vector fields for semantic search
    description_semantic = KnnVectorField(
        dimension=1536,
        space_type="cosinesimil",
        method={
            "name": "hnsw",
            "engine": "lucene",
            "parameters": {"m": 16, "ef_construction": 512},
        },
    )

    name_semantic = KnnVectorField(
        dimension=1536,
        space_type="cosinesimil",
        method={
            "name": "hnsw",
            "engine": "lucene",
            "parameters": {"m": 16, "ef_construction": 512},
        },
    )

    content_semantic = KnnVectorField(
        dimension=1536,
        space_type="cosinesimil",
        method={
            "name": "hnsw",
            "engine": "lucene",
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
            f"{django_settings.OPENSEARCH_INDEX_PREFIX}_issues"
            if django_settings.OPENSEARCH_INDEX_PREFIX
            else "issues"
        )

    class Django:
        model = Issue
        fields = ["id", "sequence_id", "priority", "deleted_at"]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 5000
        related_models = [Project, ProjectMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace", "type").prefetch_related(
            "project",
            Prefetch(
                "project__project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True),
                to_attr="active_project_members",
            ),
            Prefetch(
                "issue_relation",
                queryset=IssueRelation.objects.filter(
                    relation_type=IssueRelationChoices.DUPLICATE.value,
                    deleted_at__isnull=True,
                ).only("related_issue_id"),
                to_attr="duplicate_relations",
            ),
            Prefetch(
                "issue_related",
                queryset=IssueRelation.objects.filter(
                    relation_type=IssueRelationChoices.DUPLICATE.value,
                    deleted_at__isnull=True,
                ).only("issue_id"),
                to_attr="duplicate_relations_reverse",
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

    def prepare_duplicate_of(self, instance):
        """
        Data preparation method for duplicate_of field
        """
        duplicate_of_ids = []

        # Use prefetched duplicate relations if available
        if hasattr(instance, "duplicate_relations"):
            duplicate_of_ids.extend(
                [relation.related_issue_id for relation in instance.duplicate_relations]
            )
        else:
            # Fallback to database query if prefetch not available
            duplicate_of_ids.extend(
                instance.issue_relation.filter(
                    relation_type=IssueRelationChoices.DUPLICATE.value,
                    deleted_at__isnull=True,
                ).values_list("related_issue_id", flat=True)
            )

        # Use prefetched reverse duplicate relations if available
        if hasattr(instance, "duplicate_relations_reverse"):
            duplicate_of_ids.extend(
                [relation.issue_id for relation in instance.duplicate_relations_reverse]
            )
        else:
            # Fallback to database query if prefetch not available
            duplicate_of_ids.extend(
                instance.issue_related.filter(
                    relation_type=IssueRelationChoices.DUPLICATE.value,
                    deleted_at__isnull=True,
                ).values_list("issue_id", flat=True)
            )

        return list(set(duplicate_of_ids))  # Remove duplicates using set

    def prepare(self, instance):
        """
        Override prepare method to handle semantic field exclusion during upsert.

        If semantic fields haven't changed, exclude them from the prepared data
        to preserve existing embeddings in OpenSearch.
        """
        data = super().prepare(instance)

        # Check if semantic fields have changed
        semantic_fields_changed = getattr(instance, "_semantic_fields_changed", False)

        # If semantic fields haven't changed, exclude them to preserve existing embeddings
        if not semantic_fields_changed:
            semantic_fields = [
                "description_semantic",
                "name_semantic",
                "content_semantic",
            ]
            for field in semantic_fields:
                data.pop(field, None)

        return data


@registry.register_document
class IssueCommentDocument(BaseDocument):
    comment = fields.TextField(attr="comment_stripped")
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
    actor_id = fields.KeywordField(attr="actor_id")
    issue_id = fields.KeywordField(attr="issue_id")
    is_deleted = fields.BooleanField()
    active_project_member_user_ids = fields.ListField(fields.KeywordField())

    class Index(BaseDocument.Index):
        name = (
            f"{django_settings.OPENSEARCH_INDEX_PREFIX}_issue_comments"
            if django_settings.OPENSEARCH_INDEX_PREFIX
            else "issue_comments"
        )

    class Django:
        model = IssueComment
        fields = ["id", "deleted_at"]
        # queryset_pagination tells dsl to add chunk_size to the queryset iterator.
        # which is required for django to use prefetch_related when using iterator.
        # NOTE: This number can be different for other indexes based on complexity
        # of the query and the number of records present in that table.
        queryset_pagination = 5000
        related_models = [Project, ProjectMember]

    def apply_related_to_queryset(self, qs):
        return qs.select_related("workspace", "issue", "actor").prefetch_related(
            "project",
            Prefetch(
                "project__project_projectmember",
                queryset=ProjectMember.objects.filter(is_active=True),
                to_attr="active_project_members",
            ),
        )

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, Project):
            qs = related_instance.project_issuecomment(manager="objects").all()
        elif isinstance(related_instance, ProjectMember):
            qs = related_instance.project.project_issuecomment(manager="objects").all()
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
