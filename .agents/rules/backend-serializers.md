<!-- Scope: plane/app/serializers/**, plane/api/serializers/** -->

# Backend Serializer Patterns

> **NEVER** mix `plane/app/` serializers with `plane/api/` views or vice versa. Each API layer has its own serializers.

## Base Classes

```python
from plane.app.serializers.base import BaseSerializer, DynamicBaseSerializer

# Simple serializer
class MyModelSerializer(BaseSerializer):
    class Meta:
        model = MyModel
        fields = "__all__"
        read_only_fields = ["id", "workspace", "project", "created_by", "updated_by", "created_at", "updated_at"]

# Dynamic serializer (supports ?fields=a,b&expand=c,d)
class MyModelDynamicSerializer(DynamicBaseSerializer):
    class Meta:
        model = MyModel
        fields = "__all__"
```

## Write vs Read Serializers

Create separate serializers when write operations need different field handling:

```python
# Read — returns computed/annotated fields
class IssueSerializer(DynamicBaseSerializer): ...

# Write — accepts related IDs, handles M2M
class IssueCreateSerializer(BaseSerializer):
    label_ids = serializers.ListField(child=serializers.PrimaryKeyRelatedField(...), write_only=True)
    assignee_ids = serializers.ListField(child=serializers.PrimaryKeyRelatedField(...), write_only=True)

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        obj = MyModel.objects.create(**validated_data, project_id=self.context["project_id"])
        if assignees:
            IssueAssignee.objects.bulk_create([...], batch_size=10)
        return obj
```

## Validation Patterns

- Validate related objects belong to the **same project** (prevent cross-project references)
- Sanitize HTML: `validate_html_content()` from `plane.utils.content_validator`
- Validate binary data: `validate_binary_data()`
- Check date ranges: `start_date < target_date`
- Validate assignees have correct role: `ProjectMember.filter(role__gte=15)`
