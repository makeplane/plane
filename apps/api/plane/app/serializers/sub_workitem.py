# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third party imports
from rest_framework import serializers


class WorkitemSearchSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    type_id = serializers.UUIDField(allow_null=True)
    sequence_id = serializers.IntegerField()
    start_date = serializers.DateField(allow_null=True)
    project = serializers.DictField(child=serializers.CharField())
    workspace_slug = serializers.CharField(allow_null=True)
    state = serializers.DictField(child=serializers.CharField())

    class Meta:
        fields = [
            "id",
            "name",
            "type_id",
            "sequence_id",
            "start_date",
            "project",
            "workspace_slug",
            "state",
        ]

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "name": instance.name,
            "type_id": instance.type_id,
            "sequence_id": instance.sequence_id,
            "start_date": instance.start_date,
            "project": {
                "id": instance.project_id,
                "name": instance.project.name if instance.project else None,
                "identifier": instance.project.identifier if instance.project else None,
            },
            "workspace_slug": instance.workspace.slug if instance.workspace else None,
            "state": {
                "name": instance.state.name if instance.state else None,
                "group": instance.state.group if instance.state else None,
                "color": instance.state.color if instance.state else None,
            },
        }