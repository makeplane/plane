from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(read_only=True)

    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' arg up to the superclass
        fields = kwargs.pop("fields", None)
        remove_nested_fields = kwargs.pop("remove_nested_fields", None)

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        if fields is not None:
            # Drop any fields that are not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
            if remove_nested_fields:
                for field_name in remove_nested_fields:
                    for fields in remove_nested_fields[field_name]:
                        self.fields[field_name].fields.pop(fields)
