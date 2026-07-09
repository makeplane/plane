# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import WorkItemTemplate, WorkItemTemplateItem, WorkItemTemplateDependency


class WorkItemTemplateDependencySerializer(BaseSerializer):
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
            source_item = item_map.get(source_id) or WorkItemTemplateItem.objects.get(id=source_id, template=template)
            target_item = item_map.get(target_id) or WorkItemTemplateItem.objects.get(id=target_id, template=template)
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
