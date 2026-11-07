# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from rest_framework import serializers


# Distinguishes "the instance has no such attribute" from "the attribute is None".
_MISSING = object()


# Relations in the expansion mapper that are to-many.
MANY_EXPANSION_FIELDS = frozenset(
    {
        "members",
        "assignees",
        "labels",
        "issue_cycle",
        "issue_relation",
        "issue_intake",
        "issue_reactions",
        "issue_link",
        "sub_issues",
        "issue_related",
    }
)


def get_expansion_mapper():
    """Return the ``expand`` key -> serializer mapping.

    Shared by ``_filter_fields`` and ``to_representation`` so the two cannot drift
    apart -- keeping two copies is how ``updated_by`` came to be added to the
    ``/api/v1/`` mapper and to neither of these (makeplane/plane#4639).

    ``issue_attachment`` is deliberately absent: ``Issue.issue_attachment`` is the
    reverse manager of the legacy ``IssueAttachment`` model, which
    ``IssueAttachmentLiteSerializer`` (``model = FileAsset``) cannot serialize.
    Attachments are served by the ``issue_attachments`` block in
    ``to_representation`` below.

    Imports stay inside the function because the serializers import this module.
    """
    from . import (
        WorkspaceLiteSerializer,
        ProjectLiteSerializer,
        UserLiteSerializer,
        StateLiteSerializer,
        IssueSerializer,
        LabelSerializer,
        CycleIssueSerializer,
        IssueLiteSerializer,
        IssueRelationSerializer,
        IntakeIssueLiteSerializer,
        IssueReactionLiteSerializer,
        IssueLinkLiteSerializer,
        RelatedIssueSerializer,
    )

    return {
        "user": UserLiteSerializer,
        "workspace": WorkspaceLiteSerializer,
        "project": ProjectLiteSerializer,
        "default_assignee": UserLiteSerializer,
        "project_lead": UserLiteSerializer,
        "state": StateLiteSerializer,
        "created_by": UserLiteSerializer,
        "updated_by": UserLiteSerializer,
        "issue": IssueSerializer,
        "actor": UserLiteSerializer,
        "owned_by": UserLiteSerializer,
        "members": UserLiteSerializer,
        "assignees": UserLiteSerializer,
        "labels": LabelSerializer,
        "issue_cycle": CycleIssueSerializer,
        "parent": IssueLiteSerializer,
        "issue_relation": IssueRelationSerializer,
        "issue_intake": IntakeIssueLiteSerializer,
        "issue_related": RelatedIssueSerializer,
        "issue_reactions": IssueReactionLiteSerializer,
        "issue_link": IssueLinkLiteSerializer,
        "sub_issues": IssueLiteSerializer,
    }


class BaseSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(read_only=True)


class DynamicBaseSerializer(BaseSerializer):
    def __init__(self, *args, **kwargs):
        # 'fields' and 'expand' are custom arguments; pop them so they are not passed to the superclass.
        fields = kwargs.pop("fields", None)
        self.expand = kwargs.pop("expand", []) or []

        super().__init__(*args, **kwargs)
        # 'fields' restricts the OUTPUT only (see to_representation) so validation and saving
        # still see every writable field; 'expand' adds relations and keeps them with 'fields'.
        self._output_fields = None
        if fields is not None or self.expand:
            self.fields = self._filter_fields(fields, self.expand)

    def _filter_fields(self, fields, expand=()):
        """
        Adjust the serializer's fields.

        :param fields: Names to output (a dict item keeps its key; nested filtering is not supported),
            or None to output every field. Fields are not removed from the serializer itself.
        :param expand: Relation names to add via the expansion mapper (always output).
        :return: The updated fields for the serializer.
        """
        allowed = set(expand)
        for item in fields or []:
            if isinstance(item, str):
                allowed.add(item)
            elif isinstance(item, dict):
                allowed.update(item.keys())

        missing = [field for field in allowed if field not in self.fields]
        if missing:
            expansion = get_expansion_mapper()
            for field in missing:
                if field in expansion:
                    self.fields[field] = expansion[field](many=field in MANY_EXPANSION_FIELDS)

        if fields is not None:
            self._output_fields = allowed

        return self.fields

    @property
    def _readable_fields(self):
        # DRF's output-only field iterator (writes use self.fields), so fields= skips
        # computing and emitting everything else without touching validation or saving.
        for field in super()._readable_fields:
            if self._output_fields is None or field.field_name in self._output_fields:
                yield field

    def to_representation(self, instance):
        response = super().to_representation(instance)

        # Ensure 'expand' is iterable before processing
        if self.expand:
            expansion = get_expansion_mapper()
            for expand in self.expand:
                if expand in self.fields:
                    # Check if field in expansion then expand the field
                    if expand in expansion:
                        # Resolve against the instance rather than guessing arity from the
                        # already-serialized value. `_MISSING` separates "no such relation"
                        # from "the relation is null": `members` and `sub_issues` are
                        # SerializerMethodField/annotation names on some serializers here,
                        # and those must keep the value the serializer already produced.
                        related = getattr(instance, expand, _MISSING)
                        if isinstance(related, models.Manager):
                            response[expand] = expansion[expand](related, many=True).data
                        elif isinstance(related, models.Model):
                            response[expand] = expansion[expand](related).data
                        elif related is None:
                            # A null relation stays null, matching the unexpanded response.
                            # Serializing None emits an object built from the nested
                            # serializer's field defaults instead.
                            response[expand] = None
                    else:
                        # You might need to handle this case differently
                        response[expand] = getattr(instance, f"{expand}_id", None)

            # Check if issue_attachments is in fields or expand
            if "issue_attachments" in self.fields or "issue_attachments" in self.expand:
                # Import the model here to avoid circular imports
                from plane.db.models import FileAsset
                from . import IssueAttachmentLiteSerializer

                issue_id = getattr(instance, "id", None)

                if issue_id:
                    # Fetch related issue_attachments
                    issue_attachments = FileAsset.objects.filter(
                        issue_id=issue_id,
                        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    )
                    # Serialize issue_attachments and add them to the response
                    response["issue_attachments"] = IssueAttachmentLiteSerializer(issue_attachments, many=True).data
                else:
                    response["issue_attachments"] = []

        return response
