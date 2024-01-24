from rest_framework import serializers


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

        for field in allowed:
            if field not in self.fields:
                from . import (
                    WorkspaceLiteSerializer,
                    ProjectLiteSerializer,
                    UserLiteSerializer,
                    StateLiteSerializer,
                    IssueSerializer,
                    LabelSerializer,
                    CycleIssueSerializer,
                    IssueFlatSerializer,
                    IssueRelationSerializer,
                    InboxIssueLiteSerializer
                )

                # Expansion mapper
                expansion = {
                    "user": UserLiteSerializer,
                    "workspace": WorkspaceLiteSerializer,
                    "project": ProjectLiteSerializer,
                    "default_assignee": UserLiteSerializer,
                    "project_lead": UserLiteSerializer,
                    "state": StateLiteSerializer,
                    "created_by": UserLiteSerializer,
                    "issue": IssueSerializer,
                    "actor": UserLiteSerializer,
                    "owned_by": UserLiteSerializer,
                    "members": UserLiteSerializer,
                    "assignees": UserLiteSerializer,
                    "labels": LabelSerializer,
                    "issue_cycle": CycleIssueSerializer,
                    "parent": IssueSerializer,
                    "issue_relation": IssueRelationSerializer,
                    "issue_inbox" : InboxIssueLiteSerializer,
                }
                
                self.fields[field] = expansion[field](many=True if field in ["members", "assignees", "labels", "issue_cycle", "issue_relation", "issue_inbox"] else False)            

        return self.fields

    def to_representation(self, instance):
        response = super().to_representation(instance)

        # Ensure 'expand' is iterable before processing
        if self.expand:
            for expand in self.expand:
                if expand in self.fields:
                    # Import all the expandable serializers
                    from . import (
                        WorkspaceLiteSerializer,
                        ProjectLiteSerializer,
                        UserLiteSerializer,
                        StateLiteSerializer,
                        IssueSerializer,
                        LabelSerializer,
                        CycleIssueSerializer,
                        IssueRelationSerializer,
                        InboxIssueLiteSerializer
                    )

                    # Expansion mapper
                    expansion = {
                        "user": UserLiteSerializer,
                        "workspace": WorkspaceLiteSerializer,
                        "project": ProjectLiteSerializer,
                        "default_assignee": UserLiteSerializer,
                        "project_lead": UserLiteSerializer,
                        "state": StateLiteSerializer,
                        "created_by": UserLiteSerializer,
                        "issue": IssueSerializer,
                        "actor": UserLiteSerializer,
                        "owned_by": UserLiteSerializer,
                        "members": UserLiteSerializer,
                        "assignees": UserLiteSerializer,
                        "labels": LabelSerializer,
                        "issue_cycle": CycleIssueSerializer,
                        "parent": IssueSerializer,
                        "issue_relation": IssueRelationSerializer,
                        "issue_inbox" : InboxIssueLiteSerializer,
                    }
                    # Check if field in expansion then expand the field
                    if expand in expansion:
                        if isinstance(response.get(expand), list):
                            exp_serializer = expansion[expand](
                                getattr(instance, expand), many=True
                            )
                        else:
                            exp_serializer = expansion[expand](
                                getattr(instance, expand)
                            )
                        response[expand] = exp_serializer.data
                    else:
                        # You might need to handle this case differently
                        response[expand] = getattr(
                            instance, f"{expand}_id", None
                        )

        return response
