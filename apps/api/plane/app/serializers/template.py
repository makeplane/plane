# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from collections import defaultdict

# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import WorkItemTemplate, WorkItemTemplateItem, WorkItemTemplateDependency
from plane.db.models.issue import IssueRelationChoices


VALID_RELATION_TYPES = {choice.value for choice in IssueRelationChoices}


class WorkItemTemplateDependencySerializer(BaseSerializer):
    def validate_relation_type(self, value):
        if value not in VALID_RELATION_TYPES:
            raise serializers.ValidationError(
                f"Invalid relation type '{value}'. Must be one of: {', '.join(sorted(VALID_RELATION_TYPES))}."
            )
        return value

    class Meta:
        model = WorkItemTemplateDependency
        fields = [
            "id",
            "template",
            "source_template_item",
            "target_template_item",
            "relation_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "template",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class WorkItemTemplateItemSerializer(BaseSerializer):
    class Meta:
        model = WorkItemTemplateItem
        fields = [
            "id",
            "template",
            "name",
            "description",
            "priority",
            "type",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "template",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class WorkItemTemplateSerializer(BaseSerializer):
    items = WorkItemTemplateItemSerializer(many=True, read_only=True)
    dependencies = WorkItemTemplateDependencySerializer(many=True, read_only=True)

    class Meta:
        model = WorkItemTemplate
        fields = [
            "id",
            "name",
            "description",
            "type",
            "priority",
            "items",
            "dependencies",
            "project",
            "workspace",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class WorkItemTemplateCreateSerializer(BaseSerializer):
    items = WorkItemTemplateItemSerializer(many=True, required=False)
    dependencies = WorkItemTemplateDependencySerializer(many=True, required=False)

    class Meta:
        model = WorkItemTemplate
        fields = [
            "id",
            "name",
            "description",
            "type",
            "priority",
            "items",
            "dependencies",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]

    def _get_item_ids(self, items_data):
        ids = set()
        for item_data in items_data:
            item_id = item_data.get("id")
            if item_id is not None:
                ids.add(str(item_id))
        return ids

    def _validate_dependencies(self, item_ids, dependencies_data):
        seen = set()
        for i, dep in enumerate(dependencies_data):
            source_id = str(dep.get("source_template_item", ""))
            target_id = str(dep.get("target_template_item", ""))
            relation_type = dep.get("relation_type", "blocked_by")

            if not source_id or not target_id:
                raise serializers.ValidationError(
                    {f"dependencies[{i}]": "Both source_template_item and target_template_item are required."}
                )

            if source_id == target_id:
                raise serializers.ValidationError(
                    {f"dependencies[{i}]": "A template item cannot depend on itself."}
                )

            if source_id not in item_ids:
                raise serializers.ValidationError(
                    {f"dependencies[{i}].source_template_item": f"Template item {source_id} was not found in the items list."}
                )

            if target_id not in item_ids:
                raise serializers.ValidationError(
                    {f"dependencies[{i}].target_template_item": f"Template item {target_id} was not found in the items list."}
                )

            dep_key = (source_id, target_id, relation_type)
            if dep_key in seen:
                raise serializers.ValidationError(
                    {f"dependencies[{i}]": "Duplicate dependency definition."}
                )
            seen.add(dep_key)

    def _detect_cycles(self, items_data, dependencies_data):
        children = defaultdict(list)
        item_id_set = {str(d.get("id")) for d in items_data if d.get("id")}
        for dep in dependencies_data:
            source = str(dep.get("source_template_item", ""))
            target = str(dep.get("target_template_item", ""))
            if source and target:
                children[source].append(target)

        visited = set()
        in_stack = set()

        def dfs(node_id):
            if node_id in in_stack:
                return True
            if node_id in visited:
                return False
            visited.add(node_id)
            in_stack.add(node_id)
            for neighbor in children.get(node_id, []):
                if dfs(neighbor):
                    return True
            in_stack.remove(node_id)
            return False

        for node_id in list(item_id_set):
            visited.clear()
            in_stack.clear()
            if dfs(node_id):
                raise serializers.ValidationError(
                    {"dependencies": "Circular dependency detected. Dependencies must form a directed acyclic graph."}
                )

    def validate(self, attrs):
        items_data = attrs.get("items", [])
        dependencies_data = attrs.get("dependencies", [])

        if dependencies_data:
            if not items_data:
                raise serializers.ValidationError(
                    {"dependencies": "Cannot define dependencies without template items."}
                )
            item_ids = self._get_item_ids(items_data)
            self._validate_dependencies(item_ids, dependencies_data)
            self._detect_cycles(items_data, dependencies_data)

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        dependencies_data = validated_data.pop("dependencies", [])
        template = WorkItemTemplate.objects.create(**validated_data)

        item_map = {}
        for item_data in items_data:
            item = WorkItemTemplateItem.objects.create(template=template, **item_data)
            item_map[item_data.get("id")] = item

        for dep_data in dependencies_data:
            source_id = dep_data.pop("source_template_item")
            target_id = dep_data.pop("target_template_item")
            source_item = item_map[source_id]
            target_item = item_map[target_id]
            WorkItemTemplateDependency.objects.create(
                template=template,
                source_template_item=source_item,
                target_template_item=target_item,
                **dep_data,
            )

        return template

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        dependencies_data = validated_data.pop("dependencies", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            existing_items = {str(item.id): item for item in instance.items.all()}
            incoming_ids = set()
            for item_data in items_data:
                item_id = item_data.get("id")
                if item_id and str(item_id) in existing_items:
                    item = existing_items[str(item_id)]
                    for attr, value in item_data.items():
                        if attr != "id":
                            setattr(item, attr, value)
                    item.save()
                    incoming_ids.add(str(item_id))
                else:
                    new_item = WorkItemTemplateItem.objects.create(template=instance, **item_data)
                    incoming_ids.add(str(new_item.id))

            for item_id, item in existing_items.items():
                if item_id not in incoming_ids:
                    item.delete()

        if dependencies_data is not None:
            instance.dependencies.all().delete()
            for dep_data in dependencies_data:
                WorkItemTemplateDependency.objects.create(template=instance, **dep_data)

        return instance
