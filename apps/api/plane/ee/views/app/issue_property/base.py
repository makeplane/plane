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
from django.db import IntegrityError, models, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Issue, Workspace, IssueType, ProjectIssueType
from plane.ee.models import IssueProperty, IssuePropertyOption, PropertyTypeEnum
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.serializers import (
    IssuePropertyOptionSerializer,
    IssuePropertySerializer,
    WorkspaceWorkItemTypeSerializer,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag
from plane.ee.permissions import WorkspaceEntityPermission
from django.db.models import Case, When, Q


class WorkspaceWorkItemPropertyEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def create_options(self, issue_property, options):
        workspace_id = issue_property.workspace_id
        issue_property_id = issue_property.id

        last_id = IssuePropertyOption.objects.filter(
            workspace_id=workspace_id, property_id=issue_property_id
        ).aggregate(largest=models.Max("sort_order"))["largest"]

        sort_order = (last_id + 10000) if last_id else 10000

        bulk_create_options = [
            IssuePropertyOption(
                name=option.get("name"),
                sort_order=sort_order + (index * 10000),
                property_id=issue_property_id,
                description=option.get("description", ""),
                logo_props=option.get("logo_props", {}),
                is_active=option.get("is_active", True),
                is_default=option.get("is_default", False),
                parent_id=option.get("parent_id"),
                workspace_id=workspace_id,
            )
            for index, option in enumerate(options)
            if not option.get("id")
        ]

        IssuePropertyOption.objects.bulk_create(bulk_create_options, batch_size=100)

    def handle_options_create_update(self, issue_property, options, slug):
        bulk_create_options = []
        bulk_update_options = []

        for option in options:
            if option.get("id"):
                bulk_update_options.append(option)
            else:
                bulk_create_options.append(option)

        if bulk_update_options:
            for option in bulk_update_options:
                issue_property_option = IssuePropertyOption.objects.exclude(
                    property__issue_type_properties__issue_type__is_epic=True,
                ).get(
                    workspace__slug=slug,
                    property_id=issue_property.id,
                    pk=option["id"],
                )
                option_serializer = IssuePropertyOptionSerializer(issue_property_option, data=option, partial=True)
                option_serializer.is_valid(raise_exception=True)
                option_serializer.save()

        if bulk_create_options:
            self.create_options(issue_property, bulk_create_options)

    def create_or_update_options(self, issue_property, options, slug):
        try:
            self.handle_options_create_update(issue_property, options, slug)

            # Reset the default options if the property is required
            if issue_property.is_required:
                self.reset_options_default(issue_property)
            # Reset the default options if property is not multi and more than one default value
            if (
                not issue_property.is_multi
                and IssuePropertyOption.objects.filter(
                    property_id=issue_property.id,
                    workspace_id=issue_property.workspace_id,
                    is_default=True,
                )
                .exclude(property__issue_type_properties__issue_type__is_epic=True)
                .count()
                > 1
            ):
                self.reset_options_default(issue_property)
            self.update_property_default_options(issue_property)

        except IntegrityError:
            return Response(
                {"error": "An option with the same name already exists in this property"},
                status=status.HTTP_409_CONFLICT,
            )

    def reset_options_default(self, issue_property):
        # Reset all the default options
        IssuePropertyOption.objects.filter(
            property_id=issue_property.id,
            workspace_id=issue_property.workspace_id,
            is_default=True,
        ).exclude(
            property__issue_type_properties__issue_type__is_epic=True,
        ).update(is_default=False)

    def update_property_default_options(self, issue_property):
        # Fetch all the default options
        issue_property_options = IssuePropertyOption.objects.filter(
            property_id=issue_property.id,
            workspace_id=issue_property.workspace_id,
            is_default=True,
        ).exclude(
            property__issue_type_properties__issue_type__is_epic=True,
        ).values_list("id", flat=True)

        # Save the default value
        issue_property.default_value = [str(option) for option in issue_property_options]
        issue_property.save()

    def get_options_response(self, issue_property, slug):
        options = IssuePropertyOption.objects.filter(
            property_id=issue_property.id,
            workspace__slug=slug,
        ).exclude(property__issue_type_properties__issue_type__is_epic=True)
        options_serializer = IssuePropertyOptionSerializer(options, many=True)
        return options_serializer.data

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def get(self, request, slug, pk=None):
        # Get a single issue property
        if pk:
            issue_property = (
                IssueProperty.objects.exclude(issue_type_properties__issue_type__is_epic=True)
                .select_related("workspace", "formula_config")
                .get(workspace__slug=slug, pk=pk)
            )
            serializer = IssuePropertySerializer(issue_property)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue properties
        issue_properties = (
            IssueProperty.objects.filter(workspace__slug=slug)
            .exclude(issue_type_properties__issue_type__is_epic=True)
            .select_related("workspace", "formula_config")
        )
        serializer = IssuePropertySerializer(issue_properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def post(self, request, slug):
        try:
            # Copy request.data to avoid mutating the immutable QueryDict
            data = request.data.copy()

            # Get the options
            options = data.pop("options", [])

            issue_properties = (
                IssueProperty.objects.filter(
                    workspace__slug=slug,
                )
                .exclude(issue_type_properties__issue_type__is_epic=True)
                .values_list("display_name", flat=True)
            )

            if data.get("display_name") in issue_properties:
                return Response(
                    {"error": "Custom property with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check is_active
            if not data.get("is_active"):
                data["is_active"] = False

            # Check defaults
            if not data.get("is_multi") and len(data.get("default_value", [])) > 1:
                return Response(
                    {"error": "Default value must be a single value for non-multi properties"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if required and default_value
            if data.get("is_required") is True:
                data["default_value"] = []

            # Get workspace
            workspace = Workspace.objects.get(slug=slug)

            # Create a new issue properties
            serializer = IssuePropertySerializer(data=data)
            # Validate the data
            serializer.is_valid(raise_exception=True)
            # Save the data
            serializer.save(workspace_id=workspace.id)

            issue_property = IssueProperty.objects.exclude(issue_type_properties__issue_type__is_epic=True).get(
                workspace_id=workspace.id,
                pk=serializer.data["id"],
            )
            # Check if the property type is option and create the options
            if issue_property.property_type == "OPTION":
                self.create_or_update_options(issue_property, options, slug)

            serializer = IssuePropertySerializer(issue_property)
            # generate the response with the new data and options
            response = {
                **serializer.data,
                "options": self.get_options_response(issue_property, slug),
            }
            return Response(response, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {"error": "A Property with the same name already exists in this work item type"},
                status=status.HTTP_409_CONFLICT,
            )

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def patch(self, request, slug, pk):
        # Update an issue properties
        issue_property = IssueProperty.objects.exclude(issue_type_properties__issue_type__is_epic=True).get(
            workspace__slug=slug,
            pk=pk,
        )

        options = request.data.pop("options", [])

        if (
            request.data.get("property_type") or request.data.get("is_multi") or request.data.get("settings")
        ) and Issue.objects.filter(type__issue_type_properties__property=issue_property).exists():
            return Response(
                {"error": "Some fields cannot be updated as issues exist with this property"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # if property type is being changed, reset the defaults
        if request.data.get("property_type") and request.data.get("property_type") != issue_property.property_type:
            defaults = {
                "relation_type": None,
                "default_value": [],
                "settings": {},
                "is_multi": False,
                "validation_rules": {},
            }
            # Update request data with defaults for missing fields
            for field, default_value in defaults.items():
                request.data.setdefault(field, default_value)

        # Check defaults
        if not request.data.get("is_multi", issue_property.is_multi) and len(request.data.get("default_value", [])) > 1:
            return Response(
                {"error": "Default value must be a single value for non-multi properties"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if is_required is being set to true and remove default_value if so
        if request.data.get("is_required", issue_property.is_required) is True:
            request.data["default_value"] = []

        serializer = IssuePropertySerializer(issue_property, data=request.data, partial=True)
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()

        if issue_property.property_type == "OPTION":
            self.create_or_update_options(issue_property, options, slug)

        response = {
            **serializer.data,
            "options": self.get_options_response(issue_property, slug),
        }
        return Response(response, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def delete(self, request, slug, pk):
        # Delete an issue properties
        issue_property = IssueProperty.objects.exclude(issue_type_properties__issue_type__is_epic=True).get(
            workspace__slug=slug,
            pk=pk,
        )
        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorkItemTypeEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    def get(self, request, slug, project_id):
        # get the ones which were imported from the workspace
        imported_work_item_types = ProjectIssueType.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).values_list("issue_type_id", flat=True)

        # get the ones which were created locally in the project
        local_work_item_types = IssueType.objects.filter(
            Q(project_id=project_id, workspace__slug=slug) | Q(id__in=imported_work_item_types)
        ).annotate(
            type=Case(
                When(project_id=project_id, workspace__slug=slug, then="local"),
                When(id__in=imported_work_item_types, then="global"),
                default="local",
            )
        )
        # serialize the data and return the response
        serializer = WorkspaceWorkItemTypeSerializer(local_work_item_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssuePropertyEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [ProjectEntityPermission]

    def create_options(self, issue_property, options):
        workspace_id = issue_property.workspace_id
        issue_property_id = issue_property.id
        project_id = issue_property.project_id

        last_id = IssuePropertyOption.objects.filter(
            project=issue_property.project_id, property_id=issue_property_id
        ).aggregate(largest=models.Max("sort_order"))["largest"]

        sort_order = (last_id + 10000) if last_id else 10000

        bulk_create_options = [
            IssuePropertyOption(
                name=option.get("name"),
                sort_order=sort_order + (index * 10000),
                property_id=issue_property_id,
                description=option.get("description", ""),
                logo_props=option.get("logo_props", {}),
                is_active=option.get("is_active", True),
                is_default=option.get("is_default", False),
                parent_id=option.get("parent_id"),
                workspace_id=workspace_id,
                project_id=project_id,
            )
            for index, option in enumerate(options)
            if not option.get("id")
        ]

        IssuePropertyOption.objects.bulk_create(bulk_create_options, batch_size=100)

    def handle_options_create_update(self, issue_property, options, slug, project_id):
        bulk_create_options = []
        bulk_update_options = []

        for option in options:
            if option.get("id"):
                bulk_update_options.append(option)
            else:
                bulk_create_options.append(option)

        if bulk_update_options:
            for option in bulk_update_options:
                issue_property_option = IssuePropertyOption.objects.get(
                    workspace__slug=slug,
                    project_id=project_id,
                    property_id=issue_property.id,
                    pk=option["id"],
                    property__issue_type_properties__issue_type__is_epic=False,
                )
                option_serializer = IssuePropertyOptionSerializer(issue_property_option, data=option, partial=True)
                option_serializer.is_valid(raise_exception=True)
                option_serializer.save()

        if bulk_create_options:
            self.create_options(issue_property, bulk_create_options)

    def create_or_update_options(self, issue_property, options, slug, project_id):
        try:
            self.handle_options_create_update(issue_property, options, slug, project_id)

            # Reset the default options if the property is required
            if issue_property.is_required:
                self.reset_options_default(issue_property)
            # Reset the default options if property is not multi and more than one default value
            if (
                not issue_property.is_multi
                and IssuePropertyOption.objects.filter(
                    property_id=issue_property.id,
                    workspace_id=issue_property.workspace_id,
                    project_id=issue_property.project_id,
                    is_default=True,
                    property__issue_type_properties__issue_type__is_epic=False,
                ).count()
                > 1
            ):
                self.reset_options_default(issue_property)
            self.update_property_default_options(issue_property)

        except IntegrityError:
            return Response(
                {"error": "An option with the same name already exists in this property"},
                status=status.HTTP_409_CONFLICT,
            )

    def reset_options_default(self, issue_property):
        # Reset all the default options
        IssuePropertyOption.objects.filter(
            property_id=issue_property.id,
            workspace_id=issue_property.workspace_id,
            project_id=issue_property.project_id,
            is_default=True,
            property__issue_type_properties__issue_type__is_epic=False,
        ).update(is_default=False)

    def update_property_default_options(self, issue_property):
        # Fetch all the default options
        issue_property_options = IssuePropertyOption.objects.filter(
            property_id=issue_property.id,
            workspace_id=issue_property.workspace_id,
            project_id=issue_property.project_id,
            is_default=True,
            property__issue_type_properties__issue_type__is_epic=False,
        ).values_list("id", flat=True)

        # Save the default value
        issue_property.default_value = [str(option) for option in issue_property_options]
        issue_property.save()

    def get_options_response(self, issue_property, slug, project_id):
        options = IssuePropertyOption.objects.filter(
            property_id=issue_property.id,
            workspace__slug=slug,
            project_id=project_id,
            property__issue_type_properties__issue_type__is_epic=False,
        )
        options_serializer = IssuePropertyOptionSerializer(options, many=True)
        return options_serializer.data

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def get(self, request, slug, project_id, issue_type_id=None, pk=None):
        try:
            # Get a single issue property
            if pk:
                issue_property = (
                    IssueProperty.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        issue_type_properties__issue_type__is_epic=False,
                        pk=pk,
                    )
                    .select_related("formula_config")
                    .get()
                )
                serializer = IssuePropertySerializer(issue_property)
                return Response(serializer.data, status=status.HTTP_200_OK)

            if issue_type_id:
                # Get all issue properties for a specific issue type
                issue_properties = IssueProperty.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    issue_type_properties__issue_type_id=issue_type_id,
                    issue_type_properties__issue_type__is_epic=False,
                ).select_related("formula_config")

                serializer = IssuePropertySerializer(issue_properties, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            # Get all issue properties
            issue_types = IssueProperty.objects.filter(
                workspace__slug=slug, project_id=project_id, issue_type_properties__issue_type__is_epic=False
            ).select_related("formula_config")
            serializer = IssuePropertySerializer(issue_types, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def post(self, request, slug, project_id, issue_type_id):
        try:
            # Get the options
            options = request.data.pop("options", [])

            issue_properties = IssueProperty.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_properties__issue_type_id=issue_type_id,
                issue_type_properties__issue_type__is_epic=False,
            ).values_list("display_name", flat=True)

            if request.data.get("display_name") in issue_properties:
                return Response(
                    {"error": "Custom property with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check is_active
            if not request.data.get("is_active"):
                request.data["is_active"] = False

            # Check defaults
            if not request.data.get("is_multi") and len(request.data.get("default_value", [])) > 1:
                return Response(
                    {"error": "Default value must be a single value for non-multi properties"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if required and default_value
            if request.data.get("is_required") is True:
                request.data["default_value"] = []

            # ========== FORMULA PROPERTY ==========
            # extracting the formula and example output
            formula = request.data.pop("formula", None)
            example_output = request.data.pop("example_output", None)

            if request.data.get("property_type") == PropertyTypeEnum.FORMULA:
                # checking if the user has the feature flag enabled
                if not check_workspace_feature_flag(feature_key=FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD, slug=slug):
                    return Response(
                        {"error": "Upgrade your plan to enable formula properties"}, status=status.HTTP_403_FORBIDDEN
                    )

                # validating the formula is not empty
                if not formula:
                    return Response(
                        {"error": "Formula is required for formula properties"}, status=status.HTTP_400_BAD_REQUEST
                    )
            # ========== FORMULA PROPERTY ==========

            with transaction.atomic():
                serializer = IssuePropertySerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save(project_id=project_id, issue_type_id=issue_type_id)

                issue_property = IssueProperty.objects.get(
                    project_id=project_id,
                    issue_type_properties__issue_type_id=issue_type_id,
                    issue_type_properties__issue_type__is_epic=False,
                    pk=serializer.data["id"],
                )

                # ========== FORMULA PROPERTY ==========
                # creating the formula property
                issue_property.handle_formula_property(formula, example_output)
                # ========== FORMULA PROPERTY ==========

                if issue_property.property_type == "OPTION":
                    self.create_or_update_options(issue_property, options, slug, project_id)

            issue_property = (
                IssueProperty.objects.filter(
                    project_id=project_id,
                    issue_type_properties__issue_type_id=issue_type_id,
                    issue_type_properties__issue_type__is_epic=False,
                    pk=serializer.data["id"],
                )
                .select_related("formula_config")
                .get()
            )
            serializer = IssuePropertySerializer(issue_property)
            # generate the response with the new data and options
            response = {
                **serializer.data,
                "options": self.get_options_response(issue_property, slug, project_id),
            }
            return Response(response, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {"error": "A Property with the same name already exists in this work item type"},
                status=status.HTTP_409_CONFLICT,
            )

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def patch(self, request, slug, project_id, issue_type_id, pk):
        # Update an issue properties
        issue_property = IssueProperty.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_properties__issue_type_id=issue_type_id,
            issue_type_properties__issue_type__is_epic=False,
            pk=pk,
        )

        options = request.data.pop("options", [])

        if (
            request.data.get("property_type") or request.data.get("is_multi") or request.data.get("settings")
        ) and Issue.objects.filter(type_id=issue_type_id).exists():
            return Response(
                {"error": "Some fields cannot be updated as issues exist with this property"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ========== FORMULA PROPERTY ==========
        # extracting the formula and example output
        formula = request.data.pop("formula", None)
        example_output = request.data.pop("example_output", None)

        # validating the formula is not empty
        if request.data.get("property_type") == PropertyTypeEnum.FORMULA:
            # checking if the user has the feature flag enabled
            if not check_workspace_feature_flag(feature_key=FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD, slug=slug):
                return Response(
                    {"error": "Upgrade your plan to enable formula properties"}, status=status.HTTP_403_FORBIDDEN
                )
        # ========== FORMULA PROPERTY ==========

        # if property type is being changed, reset the defaults
        if request.data.get("property_type") and request.data.get("property_type") != issue_property.property_type:
            defaults = {
                "relation_type": None,
                "default_value": [],
                "settings": {},
                "is_multi": False,
                "validation_rules": {},
            }
            # Update request data with defaults for missing fields
            for field, default_value in defaults.items():
                request.data.setdefault(field, default_value)

            # ========== FORMULA PROPERTY ==========
            # deleting the formula config if changing away from FORMULA type
            if issue_property.property_type == PropertyTypeEnum.FORMULA and issue_property.formula_config:
                issue_property.formula_config.delete()
                issue_property.formula_config = None
            # ========== FORMULA PROPERTY ==========

        # Check defaults
        if not request.data.get("is_multi", issue_property.is_multi) and len(request.data.get("default_value", [])) > 1:
            return Response(
                {"error": "Default value must be a single value for non-multi properties"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if is_required is being set to true and remove default_value if so
        if request.data.get("is_required", issue_property.is_required) is True:
            request.data["default_value"] = []

        with transaction.atomic():
            serializer = IssuePropertySerializer(issue_property, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            issue_property.refresh_from_db()

            if issue_property.property_type == "OPTION":
                self.create_or_update_options(issue_property, options, slug, project_id)

            # ========== FORMULA PROPERTY ==========
            # updating the formula property
            if formula:
                issue_property.handle_formula_property(formula, example_output)
            # ========== FORMULA PROPERTY ==========

        # Re-fetch with formula_config for response
        issue_property = IssueProperty.objects.filter(pk=issue_property.id).select_related("formula_config").get()
        serializer = IssuePropertySerializer(issue_property)
        response = {
            **serializer.data,
            "options": self.get_options_response(issue_property, slug, project_id),
        }
        return Response(response, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def delete(self, request, slug, project_id, issue_type_id, pk):
        # Delete an issue properties
        issue_property = IssueProperty.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_properties__issue_type_id=issue_type_id,
            issue_type_properties__issue_type__is_epic=False,
            pk=pk,
        )

        # ========== FORMULA PROPERTY ==========
        # deleting the formula config when we delete the issue property
        if issue_property.formula_config:
            issue_property.formula_config.delete()
        # ========== FORMULA PROPERTY ==========

        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
