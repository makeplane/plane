# Third party imports
from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    """
    Base serializer providing common functionality for all model serializers.

    Features field filtering, dynamic expansion of related fields, and standardized
    primary key handling for consistent API responses across the application.
    """

    id = serializers.PrimaryKeyRelatedField(read_only=True)

    def __init__(self, *args, **kwargs):
        # If 'fields' is provided in the arguments, remove it and store it separately.
        # This is done so as not to pass this custom argument up to the superclass.
        fields = kwargs.pop("fields", [])
        self.expand = kwargs.pop("expand", []) or []

        # Call the initialization of the superclass.
        super().__init__(*args, **kwargs)

        # If 'fields' was provided, filter the fields of the serializer accordingly.
        if fields:
            self.fields = self._filter_fields(fields=fields)

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

        # Convert the current serializer's fields and the allowed fields to sets.
        existing = set(self.fields)
        allowed = set(allowed)

        # Remove fields from the serializer that aren't in the 'allowed' list.
        for field_name in existing - allowed:
            self.fields.pop(field_name)

        return self.fields

    def to_representation(self, instance):
        response = super().to_representation(instance)

        # Ensure 'expand' is iterable before processing
        if self.expand:
            for expand in self.expand:
                if expand in self.fields:
                    # Import all the expandable serializers
                    from . import (
                        IssueSerializer,
                        IssueLiteSerializer,
                        ProjectLiteSerializer,
                        StateLiteSerializer,
                        UserLiteSerializer,
                        WorkspaceLiteSerializer,
                        EstimatePointSerializer,
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
                        "parent": IssueLiteSerializer,
                        "estimate_point": EstimatePointSerializer,
                    }
                    # Check if field in expansion  then expand the field
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
                        response[expand] = getattr(instance, f"{expand}_id", None)

        return response
