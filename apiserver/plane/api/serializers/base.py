from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(read_only=True)


def filterFields(self, fields):
    for field_name in fields:
         if isinstance(field_name, dict):
            for key, value in field_name.items():
                if isinstance(value, list):
                    filterFields(self.fields[key], value) 
    allowed = []
    for item in fields:
        if isinstance(item, str):
            allowed.append(item)
        elif isinstance(item, dict):
            allowed.append(list(item.keys())[0])
    existing = set(self.fields)
    allowed = set(allowed)
    for field_name in (existing - allowed):
        self.fields.pop(field_name)
    return self.fields


class DynamicBaseSerializer(BaseSerializer):
    id = serializers.PrimaryKeyRelatedField(read_only=True)

    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' arg up to the superclass
        fields = kwargs.pop("fields", None)
        print(fields)

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        if fields is not None:
            # Drop any fields that are not specified in the `fields` argument.
                self.fields = filterFields(self, fields)