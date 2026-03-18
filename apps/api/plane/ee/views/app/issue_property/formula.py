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

# Python imports
from typing import Optional, Union

# Third party imports
from django.db.models.fields import UUIDField
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response

# Module imports
from plane.db.models import IssueType, Project, Workspace
from plane.ee.permissions import ProjectEntityPermission, WorkspaceEntityPermission
from plane.ee.utils.formula import (
    execute_formula,
    fetch_work_item_custom_properties,
    fetch_work_item_properties,
    validate_formula,
)
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


def _validate_workspace(workspace_slug: str) -> Workspace:
    """
    Validate workspace by slug

    Args:
        workspace_slug: Workspace slug

    Returns:
        Workspace: Workspace object
    """
    try:
        workspace = Workspace.objects.get(slug=workspace_slug)
        return workspace
    except Workspace.DoesNotExist:
        raise APIException(detail="Workspace not found", code="not_found")
    except Exception as e:
        raise APIException(detail=str(e), code="something_went_wrong")


def _validate_project(workspace_id: Union[str, UUIDField], project_id: Union[str, UUIDField]) -> Project:
    """
    Validate project by workspace id and project id

    Args:
        workspace_id (Union[str, UUIDField])
        project_id (Union[str, UUIDField])

    Returns:
        Project: Project object
    """

    try:
        project = Project.objects.get(workspace_id=workspace_id, id=project_id)
        return project
    except Project.DoesNotExist:
        raise APIException(detail="Project not found", code="not_found")
    except Exception as e:
        raise APIException(detail=str(e), code="something_went_wrong")


def _validate_issue_type(
    workspace_id: Union[str, UUIDField], project_id: Union[str, UUIDField], issue_type_id: Union[str, UUIDField]
) -> IssueType:
    """
    Validate issue type.

    Args:
        workspace_id: Workspace ID
        project_id: Project ID
        issue_type_id: Issue type ID

    Returns:
        IssueType: Issue type object
    """

    try:
        issue_type = IssueType.objects.get(
            workspace_id=workspace_id, project_issue_types__project_id=project_id, id=issue_type_id
        )
        return issue_type
    except IssueType.DoesNotExist:
        raise APIException(detail="Issue type not found", code="not_found")
    except Exception as e:
        raise APIException(detail=str(e), code="something_went_wrong")


class WorkspaceWorkItemTypeFormulaValidateEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD)
    def post(self, request, slug, issue_type_id):
        # validating workspace
        workspace = _validate_workspace(workspace_slug=slug)
        workspace_id = workspace.id

        # validate issue type
        issue_type = IssueType.objects.get(workspace_id=workspace_id, id=issue_type_id)
        issue_type_id = issue_type.id

        # requiring the formula
        formula: Optional[str] = request.data.get("formula", None)
        if not formula:
            raise APIException(detail="Formula is required", code="bad_request")

        # requiring the work item
        work_item_id = request.data.get("work_item", None)

        # fetching the work item properties
        work_item_properties = fetch_work_item_properties(work_item_id=work_item_id)

        # fetching the work item type properties
        work_item_type_properties = fetch_work_item_custom_properties(
            work_item_type_id=issue_type_id, work_item_id=work_item_id
        )

        # combining the work item properties and work item type properties
        properties = work_item_properties + work_item_type_properties

        # validating the formula
        validated_formula = validate_formula(formula=formula, work_item_properties=properties)
        validated_formula_response = {
            "valid": validated_formula.valid,
            "result_type": validated_formula.result_type,
            "error": validated_formula.error,
            "referenced_fields": list(validated_formula.referenced_fields),
        }

        # executing the formula
        executed_formula_response = None
        if validated_formula.valid and work_item_id:
            executed_formula = execute_formula(formula=formula, work_item_properties=properties)
            executed_formula_response = {
                "success": executed_formula.success,
                "result_type": executed_formula.result_type,
                "value": executed_formula.value,
                "error": executed_formula.error,
            }

        # response
        return_response = {
            "validated_formula": validated_formula_response,
            "executed_formula": executed_formula_response,
        }

        return Response(return_response, status=status.HTTP_200_OK)


class IssuePropertyFormulaValidateEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD)
    def post(self, request, slug, project_id, issue_type_id):
        try:
            # validating workspace
            workspace = _validate_workspace(workspace_slug=slug)
            workspace_id = workspace.id

            # validating project
            project = _validate_project(workspace_id=workspace_id, project_id=project_id)
            project_id = project.id

            # validate issue type
            issue_type = _validate_issue_type(
                workspace_id=workspace_id, project_id=project_id, issue_type_id=issue_type_id
            )
            issue_type_id = issue_type.id

            # requiring the formula
            formula: Optional[str] = request.data.get("formula", None)
            if not formula:
                raise APIException(detail="Formula is required", code="bad_request")

            # requiring the work item
            work_item_id = request.data.get("work_item", None)

            # fetching the work item properties
            work_item_properties = fetch_work_item_properties(work_item_id=work_item_id)

            # fetching the work item type properties
            work_item_type_properties = fetch_work_item_custom_properties(
                work_item_type_id=issue_type_id, work_item_id=work_item_id
            )

            # combining the work item properties and work item type properties
            properties = work_item_properties + work_item_type_properties

            # validating the formula
            validated_formula = validate_formula(formula=formula, work_item_properties=properties)
            validated_formula_response = {
                "valid": validated_formula.valid,
                "result_type": validated_formula.result_type,
                "error": validated_formula.error,
                "referenced_fields": list(validated_formula.referenced_fields),
            }

            # executing the formula
            executed_formula_response = None
            if validated_formula.valid and work_item_id:
                executed_formula = execute_formula(formula=formula, work_item_properties=properties)
                executed_formula_response = {
                    "success": executed_formula.success,
                    "result_type": executed_formula.result_type,
                    "value": executed_formula.value,
                    "error": executed_formula.error,
                }

            # response
            return_response = {
                "validated_formula": validated_formula_response,
                "executed_formula": executed_formula_response,
            }

            return Response(return_response, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
