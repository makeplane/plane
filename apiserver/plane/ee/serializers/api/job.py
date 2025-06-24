# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import ImportJob, ImportReport
from plane.db.models import User, Project, Workspace, IssueRelation

# Seriaizers
from rest_framework import serializers


class ImportReportAPISerializer(BaseSerializer):
    class Meta:
        model = ImportReport
        fields = "__all__"


class ImportJobAPISerializer(BaseSerializer):
    workspace_slug = serializers.CharField(source="workspace.slug", read_only=True)
    report = ImportReportAPISerializer(read_only=True)
    initiator_email = serializers.CharField(source="initiator.email", read_only=True)

    # Representation Values
    workspace_id = serializers.PrimaryKeyRelatedField(
        source="workspace", queryset=Workspace.objects.all()
    )
    project_id = serializers.PrimaryKeyRelatedField(
        source="project",
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
    )
    initiator_id = serializers.PrimaryKeyRelatedField(
        source="initiator", queryset=User.objects.all()
    )
    report_id = serializers.PrimaryKeyRelatedField(
        source="report", queryset=ImportReport.objects.all()
    )

    def validate_relation_map(self, value):
        """
        Validate the relation_map field.
        Sample value:
        {
            "issue": {
                "ABC-123": [
                    {"identifier": "ABC-568", "relation": "blocked_by"},
                    {"identifier": "ABC-569", "relation": "parent_id"},
                ],
                "ABC-568": [
                    {"identifier": "ABC-123", "relation": "relates_to"},
                    {"identifier": "ABC-569", "relation": "start_before"},
                ],
            }
        }
        """
        if not isinstance(value, dict) or "issue" not in value:
            raise serializers.ValidationError(
                "relation_map must contain an 'issue' key"
            )

        valid_relations = set(x[0] for x in IssueRelation.RELATION_CHOICES) | {
            "parent_id"
        }

        for issue_id, relation_entries in value["issue"].items():
            if not isinstance(relation_entries, list):
                raise serializers.ValidationError(
                    f"Relations for issue {issue_id} must be a list"
                )

            for relation_entry in relation_entries:
                if not isinstance(relation_entry, dict):
                    raise serializers.ValidationError(
                        "Each relation must be a dictionary"
                    )

                if (
                    "identifier" not in relation_entry
                    or "relation" not in relation_entry
                ):
                    raise serializers.ValidationError(
                        "Each relation must have 'identifier' and 'relation' keys"
                    )

                if relation_entry["relation"] not in valid_relations:
                    raise serializers.ValidationError(
                        f"Invalid relation type: {relation_entry['relation']}"
                    )

        return value

    class Meta:
        model = ImportJob
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
            "initiator",
            "report",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def update(self, instance, validated_data):
        new_relation_map = validated_data.pop("relation_map", {})
        merged_relation_map = {}

        if self.partial:
            # Start with a copy of the existing relation_map
            merged_relation_map = (
                dict(instance.relation_map) if instance.relation_map else {}
            )
            merged_relation_map["issue"] = dict(merged_relation_map.get("issue", {}))

            # Merge the relation mappings according to the following logic:
            # 1. If an issue exists in both maps, merge their relation arrays
            # 2. If an issue exists only in new map, add it to existing map
            if "issue" in new_relation_map:
                for issue_id, new_relations in new_relation_map["issue"].items():
                    if issue_id in merged_relation_map["issue"]:
                        existing_relations = {
                            (rel["identifier"], rel["relation"])
                            for rel in merged_relation_map["issue"][issue_id]
                        }
                        for new_rel in new_relations:
                            existing_relations.add(
                                (new_rel["identifier"], new_rel["relation"])
                            )
                        merged_relation_map["issue"][issue_id] = [
                            {"identifier": identifier, "relation": relation}
                            for identifier, relation in existing_relations
                        ]
                    else:
                        merged_relation_map["issue"][issue_id] = new_relations
        else:
            merged_relation_map = new_relation_map

        validated_data["relation_map"] = merged_relation_map
        return super().update(instance, validated_data)
