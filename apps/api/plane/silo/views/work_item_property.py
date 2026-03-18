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

# Django imports
from django.db import models

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import IssuePropertyAPISerializer
from plane.db.models import Workspace, Project, IssueType
from plane.ee.models import IssueProperty, IssuePropertyOption, IssueTypeProperty, PropertyTypeEnum, RelationTypeEnum
from plane.silo.views.base import BaseServiceAPIView
from plane.ee.utils.workspace_feature import check_workspace_feature, WorkspaceFeatureContext


def validate_list_input(data):
    """Validate that input is a list"""
    if not isinstance(data, list):
        return Response(
            {"error": "Expected a list of properties"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


class IssuePropertyLogoMixin:
    type_logo_props = {
        PropertyTypeEnum.TEXT: {
            "in_use": "icon",
            "icon": {"name": "AlignLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DECIMAL: {
            "in_use": "icon",
            "icon": {"name": "Hash", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.OPTION: {
            "in_use": "icon",
            "icon": {"name": "CircleChevronDown", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.BOOLEAN: {
            "in_use": "icon",
            "icon": {"name": "ToggleLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DATETIME: {
            "in_use": "icon",
            "icon": {"name": "Calendar", "color": "#6d7b8a"},
        },
        f"{PropertyTypeEnum.RELATION}_{RelationTypeEnum.USER}": {
            "in_use": "icon",
            "icon": {"name": "UsersRound", "color": "#6d7b8a"},
        },
        f"{PropertyTypeEnum.RELATION}_{RelationTypeEnum.RELEASE}": {
            "in_use": "icon",
            "icon": {"name": "Release", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.URL: {
            "in_use": "icon",
            "icon": {"name": "Link", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.EMAIL: {
            "in_use": "icon",
            "icon": {"name": "Envelope", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.FILE: {
            "in_use": "icon",
            "icon": {"name": "File", "color": "#6d7b8a"},
        },
    }

    def get_logo_props(self, property_type, relation_type=None):
        """Get logo properties for issue property"""
        if property_type == PropertyTypeEnum.RELATION:
            return self.type_logo_props.get(f"{PropertyTypeEnum.RELATION}_{relation_type}")
        return self.type_logo_props.get(property_type)


class IssuePropertyBulkOperationAPIView(BaseServiceAPIView, IssuePropertyLogoMixin):
    """Bulk create/update endpoint for issue properties"""

    model = IssueProperty
    serializer_class = IssuePropertyAPISerializer

    def post(self, request, slug, project_id, type_id):

        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)
            issue_type = IssueType.objects.get(pk=type_id, workspace=workspace, project_issue_types__project=project)
        except (Workspace.DoesNotExist, Project.DoesNotExist, IssueType.DoesNotExist):
            return Response(
                {"error": "Workspace, project or issue type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        created = []
        updated = []
        errored = []

        # Get all external IDs to check for existing properties
        external_lookup = {}
        for property_data in request.data:
            external_id = property_data.get("external_id")
            external_source = property_data.get("external_source")
            if external_id and external_source:
                external_lookup[(external_source, external_id)] = property_data

        # Fetch existing properties in bulk
        existing_properties = {}
        if external_lookup:
            existing_props = self.model.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_id=type_id,
                external_source__in=[k[0] for k in external_lookup.keys()],
                external_id__in=[k[1] for k in external_lookup.keys()],
            )
            for prop in existing_props:
                existing_properties[(prop.external_source, prop.external_id)] = prop

        for property_data in request.data:
            try:
                external_id = property_data.get("external_id")
                external_source = property_data.get("external_source")

                existing_property = None
                if external_id and external_source:
                    existing_property = existing_properties.get((external_source, external_id))

                if existing_property:
                    # Logic for existing property:
                    # 1. Check for new options and create them if missing
                    # 2. Return the property as is (no updates to property fields)

                    options_data = property_data.get("options", [])
                    if options_data and existing_property.property_type == PropertyTypeEnum.OPTION:
                        # Get existing options for this property
                        existing_options = IssuePropertyOption.objects.filter(
                            property=existing_property,
                            external_source__in=[
                                opt.get("external_source") for opt in options_data if opt.get("external_source")
                            ],
                            external_id__in=[opt.get("external_id") for opt in options_data if opt.get("external_id")],
                        ).values_list("external_source", "external_id")

                        existing_options_set = set(existing_options)
                        options_to_create = []

                        # Determine if we need to fetch the last sort order
                        # We only need it if we are actually creating creating options
                        # We defer fetching it until we know we have options to create to save a query
                        sort_order = None

                        for option_data in options_data:
                            opt_ext_id = option_data.get("external_id")
                            opt_ext_source = option_data.get("external_source")

                            if (
                                opt_ext_id
                                and opt_ext_source
                                and (opt_ext_source, opt_ext_id) not in existing_options_set
                            ):
                                # New option found
                                if sort_order is None:
                                    last_sort_order = IssuePropertyOption.objects.filter(
                                        project=project,
                                        property=existing_property,
                                    ).aggregate(largest=models.Max("sort_order"))["largest"]
                                    sort_order = last_sort_order + 10000 if last_sort_order is not None else 10000

                                option_instance = IssuePropertyOption(
                                    workspace=workspace,
                                    project=project,
                                    property=existing_property,
                                    name=option_data.get("name"),
                                    description=option_data.get("description", ""),
                                    is_default=option_data.get("is_default", False),
                                    external_id=opt_ext_id,
                                    external_source=opt_ext_source,
                                    sort_order=sort_order,
                                )
                                options_to_create.append(option_instance)
                                sort_order += 10000

                        if options_to_create:
                            IssuePropertyOption.objects.bulk_create(options_to_create)

                    # Return the existing property
                    updated.append(self.serializer_class(existing_property).data)

                else:
                    # Create new property using serializer
                    # This handles:
                    # 1. Property creation with correct name (slugify) and sort_order
                    # 2. IssueTypeProperty creation
                    # 3. Option creation
                    serializer = self.serializer_class(
                        data=property_data,
                        context={"issue_type": issue_type, "project": project},
                    )
                    logo_props = self.get_logo_props(
                        property_data.get("property_type"),
                        property_data.get("relation_type"),
                    )
                    if serializer.is_valid():
                        serializer.save(
                            workspace=workspace,
                            project=project,
                            issue_type=issue_type,
                            logo_props=logo_props,
                        )
                        created.append(serializer.data)
                    else:
                        errored.append({"payload": property_data, "error": str(serializer.errors)})

            except Exception as e:
                errored.append({"payload": property_data, "error": str(e)})

        return Response(
            {
                "created": created,
                "updated": updated,
                "errored": errored,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceIssuePropertyBulkOperationAPIView(BaseServiceAPIView, IssuePropertyLogoMixin):
    """Bulk create/update endpoint for workspace issue properties"""

    model = IssueProperty
    serializer_class = IssuePropertyAPISerializer

    def post(self, request, slug, type_id):
        error_response = validate_list_input(request.data)
        if error_response:
            return error_response

        try:
            workspace = Workspace.objects.get(slug=slug)
            issue_type = IssueType.objects.get(pk=type_id, workspace=workspace)
        except (Workspace.DoesNotExist, IssueType.DoesNotExist):
            return Response(
                {"error": "Workspace or issue type not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if the workspace has the feature flag enabled
        if not check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
            return Response(
                {"error": "Workspace work item types are not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        updated = []
        errored = []
        properties_to_associate = []

        # Get all external IDs to check for existing properties
        external_lookup = {}
        for property_data in request.data:
            external_id = property_data.get("external_id")
            external_source = property_data.get("external_source")
            if external_id and external_source:
                external_lookup[(external_source, external_id)] = property_data

        # Fetch existing properties in bulk
        existing_properties = {}
        if external_lookup:
            existing_props = self.model.objects.filter(
                workspace=workspace,
                external_source__in=[k[0] for k in external_lookup.keys()],
                external_id__in=[k[1] for k in external_lookup.keys()],
            )
            for prop in existing_props:
                existing_properties[(prop.external_source, prop.external_id)] = prop

        for property_data in request.data:
            try:
                external_id = property_data.get("external_id")
                external_source = property_data.get("external_source")

                existing_property = None
                if external_id and external_source:
                    existing_property = existing_properties.get((external_source, external_id))

                if existing_property:
                    # Logic for existing property:
                    # 1. Check for new options and create them if missing
                    # 2. Return the property as is (no updates to property fields)

                    options_data = property_data.get("options", [])
                    if options_data and existing_property.property_type == PropertyTypeEnum.OPTION:
                        # Get existing options for this property
                        existing_options = IssuePropertyOption.objects.filter(
                            property=existing_property,
                            external_source__in=[
                                opt.get("external_source") for opt in options_data if opt.get("external_source")
                            ],
                            external_id__in=[opt.get("external_id") for opt in options_data if opt.get("external_id")],
                        ).values_list("external_source", "external_id")

                        existing_options_set = set(existing_options)
                        options_to_create = []

                        # Determine if we need to fetch the last sort order
                        sort_order = None

                        for option_data in options_data:
                            opt_ext_id = option_data.get("external_id")
                            opt_ext_source = option_data.get("external_source")

                            if (
                                opt_ext_id
                                and opt_ext_source
                                and (opt_ext_source, opt_ext_id) not in existing_options_set
                            ):
                                # New option found
                                if sort_order is None:
                                    last_sort_order = IssuePropertyOption.objects.filter(
                                        workspace=workspace,
                                        property=existing_property,
                                    ).aggregate(largest=models.Max("sort_order"))["largest"]
                                    sort_order = last_sort_order + 10000 if last_sort_order is not None else 10000

                                option_instance = IssuePropertyOption(
                                    workspace=workspace,
                                    property=existing_property,
                                    name=option_data.get("name"),
                                    description=option_data.get("description", ""),
                                    is_default=option_data.get("is_default", False),
                                    external_id=opt_ext_id,
                                    external_source=opt_ext_source,
                                    sort_order=sort_order,
                                )
                                options_to_create.append(option_instance)
                                sort_order += 10000

                        if options_to_create:
                            IssuePropertyOption.objects.bulk_create(options_to_create)

                    # Return the existing property
                    updated.append(self.serializer_class(existing_property).data)
                    properties_to_associate.append(existing_property)

                else:
                    # Create new property using serializer
                    serializer = self.serializer_class(
                        data=property_data,
                        context={"issue_type": None, "project": None},
                    )
                    if serializer.is_valid():
                        new_property = serializer.save(
                            workspace=workspace,
                            project=None,
                            issue_type=None,
                            logo_props=self.get_logo_props(
                                property_data.get("property_type"),
                                property_data.get("relation_type"),
                            ),
                        )
                        created.append(serializer.data)
                        properties_to_associate.append(new_property)
                    else:
                        errored.append({"payload": property_data, "error": str(serializer.errors)})

            except Exception as e:
                errored.append({"payload": property_data, "error": str(e)})

        # Bulk create IssueTypeProperty associations
        if properties_to_associate:
            # Calculate last sort order
            last_sort_order = IssueTypeProperty.objects.filter(
                workspace=workspace,
                issue_type=issue_type,
                deleted_at__isnull=True,
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            sort_order = (last_sort_order if last_sort_order else 0) + 10000

            issue_type_properties_to_create = [
                IssueTypeProperty(
                    workspace=workspace,
                    issue_type=issue_type,
                    property=prop,
                    sort_order=sort_order + (i * 10000),
                )
                for i, prop in enumerate(properties_to_associate)
            ]
            IssueTypeProperty.objects.bulk_create(issue_type_properties_to_create, ignore_conflicts=True)

        return Response(
            {
                "created": created,
                "updated": updated,
                "errored": errored,
            },
            status=status.HTTP_200_OK,
        )
