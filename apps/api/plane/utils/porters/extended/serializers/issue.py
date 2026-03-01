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

# Module imports
from plane.utils.porters.serializers import IssueExportSerializer


class ExtendedIssueExportSerializer(IssueExportSerializer):
    """
    Extended export serializer with EE-specific fields:
    - IssueType & is_epic
    - Worklogs/Time tracking
    - Custom Properties (JSON)
    - Customers & Initiatives
    """

    # Issue Type fields
    issue_type = serializers.CharField(source="type.name", read_only=True, default="")
    is_epic = serializers.BooleanField(source="type.is_epic", read_only=True, default=False)

    # Worklog/Time tracking
    total_time_logged = serializers.SerializerMethodField()
    worklogs = serializers.SerializerMethodField()

    # Custom Properties (JSON string to prevent CSV flattening)
    custom_properties = serializers.SerializerMethodField()

    # EE-specific relations
    customers = serializers.SerializerMethodField()
    initiatives = serializers.SerializerMethodField()

    class Meta(IssueExportSerializer.Meta):
        # Extend parent fields with new ones
        fields = IssueExportSerializer.Meta.fields + [
            "issue_type",
            "is_epic",
            "total_time_logged",
            "worklogs",
            "custom_properties",
            "customers",
            "initiatives",
        ]

    def get_total_time_logged(self, obj):
        """Return total time logged as formatted string (e.g., '2h 30m')."""
        total = sum(wl.duration for wl in obj.worklogs.all())
        hours = total // 60
        minutes = total % 60
        return f"{hours}h {minutes}m"

    def get_worklogs(self, obj):
        """Return list of worklog entries."""
        return [
            {
                "duration": wl.duration,
                "description": wl.description,
                "logged_by": wl.logged_by.full_name if wl.logged_by else "",
                "created_at": wl.created_at.strftime("%Y-%m-%d %H:%M:%S") if wl.created_at else "",
            }
            for wl in obj.worklogs.all()
        ]

    def get_custom_properties(self, obj):
        """
        Return custom properties as a JSON string.

        Uses prefetched `properties`, `properties__property`, and `properties__value_option`
        from export_task.py - no additional queries needed.
        """
        import json
        from plane.ee.models.issue_properties import PropertyTypeEnum

        # No type = no custom properties
        if not obj.type_id:
            return ""

        properties = {}

        for prop_value in obj.properties.all():
            prop = prop_value.property
            if not prop.is_active:
                continue

            prop_type = prop.property_type
            display_name = prop.display_name

            # Extract value based on property type
            if prop_type in (PropertyTypeEnum.TEXT, PropertyTypeEnum.URL, PropertyTypeEnum.EMAIL):
                value = prop_value.value_text
            elif prop_type == PropertyTypeEnum.BOOLEAN:
                value = prop_value.value_boolean
            elif prop_type == PropertyTypeEnum.DECIMAL:
                value = prop_value.value_decimal
            elif prop_type == PropertyTypeEnum.DATETIME:
                value = prop_value.value_datetime.isoformat() if prop_value.value_datetime else None
            elif prop_type == PropertyTypeEnum.OPTION:
                value = prop_value.value_option.name if prop_value.value_option else None
            elif prop_type in (PropertyTypeEnum.RELATION, PropertyTypeEnum.FILE):
                value = str(prop_value.value_uuid) if prop_value.value_uuid else None
            else:
                value = None

            properties[display_name] = value

        return json.dumps(properties) if properties else ""

    def get_customers(self, obj):
        """Return list of customer names from CustomerRequestIssue."""
        return [
            cri.customer.name
            for cri in obj.customer_request_issues.all()
            if cri.customer and cri.customer_request is None
        ]

    def get_initiatives(self, obj):
        """Return list of initiative names from InitiativeEpic (only for epics)."""
        if not (obj.type and obj.type.is_epic):
            return []
        return [ie.initiative.name for ie in obj.initiative_epics.all() if ie.initiative]
