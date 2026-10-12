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
        # If 'fields' is provided in the arguments, remove it and store it separately.
        # This is done so as not to pass this custom argument up to the superclass.
        fields = kwargs.pop("fields", [])
        self.expand = kwargs.pop("expand", []) or []
        fields = self.expand

        # Call the initialization of the superclass.
        super().__init__(*args, **kwargs)
        # If 'fields' was provided, filter the fields of the serializer accordingly.
        if fields is not None:
            self.fields = self._filter_fields(fields)

    def _filter_fields(self, fields):
        """
        Adjust the serializer's fields based on the provided 'fields' list.

        :param fields: List or dictionary specifying which fields to include in the serializer.
        :return: The updated fields for the serializer.
        """
        # Check each field_name in the provided fields.
        for field_name in fields:
            # If the field is a dictionary (indicating nested fields),
            # loop through its keys and values.
            if isinstance(field_name, dict):
                for key, value in field_name.items():
                    # If the value of this nested field is a list,
                    # perform a recursive filter on it.
                    if isinstance(value, list):
                        self._filter_fields(self.fields[key], value)

        # Create a list to store allowed fields.
        allowed = []
        for item in fields:
            # If the item is a string, it directly represents a field's name.
            if isinstance(item, str):
                allowed.append(item)
            # If the item is a dictionary, it represents a nested field.
            # Add the key of this dictionary to the allowed list.
            elif isinstance(item, dict):
                allowed.append(list(item.keys())[0])

        missing = [field for field in allowed if field not in self.fields]
        if missing:
            expansion = get_expansion_mapper()
            for field in missing:
                if field in expansion:
                    self.fields[field] = expansion[field](many=field in MANY_EXPANSION_FIELDS)

        return self.fields

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
