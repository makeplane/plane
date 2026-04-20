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

from rest_framework import status
from rest_framework.response import Response

from plane.ee.views.base import BaseAPIView
from plane.db.models import (
    ProjectMember,
    Page,
)
from plane.payment.flags.flag import FeatureFlag
from plane.ee.models import (
    PageCollection,
    TeamspaceMember,
)
from plane.ee.bgtasks.page_update import nested_page_update
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, WikiPermissions


from plane.ee.utils.page_events import PageAction, MoveActionEnum
from plane.ee.utils.page_operations import (
    unlink_pages_from_project,
    unlink_pages_from_teamspace,
    make_pages_workspace_level,
    link_pages_to_project,
    link_pages_to_teamspace,
    remove_pages_from_workspace_level,
    move_entities_to_workspace,
    move_entities_to_teamspace,
    move_entities_to_project,
)


# Direct mapper dictionary
MOVE_ACTION_MAPPER = {
    MoveActionEnum.WORKSPACE_TO_PROJECT: ("workspace", "project"),
    MoveActionEnum.PROJECT_TO_WORKSPACE: ("project", "workspace"),
    MoveActionEnum.TEAMSPACE_TO_PROJECT: ("teamspace", "project"),
    MoveActionEnum.PROJECT_TO_TEAMSPACE: ("project", "teamspace"),
    MoveActionEnum.PROJECT_TO_PROJECT: ("project", "project"),
    MoveActionEnum.TEAMSPACE_TO_TEAMSPACE: ("teamspace", "teamspace"),
    MoveActionEnum.WORKSPACE_TO_TEAMSPACE: ("workspace", "teamspace"),
    MoveActionEnum.TEAMSPACE_TO_WORKSPACE: ("teamspace", "workspace"),
}


class MovePageEndpoint(BaseAPIView):
    """
    this segment checks the permission for the move operation whether they can move the
    page to workspace, project, teamspace
    """

    def _check_teamspace_access(self, slug, teamspace_id, user_id):
        return TeamspaceMember.objects.filter(
            workspace__slug=slug,
            team_space_id=teamspace_id,
            member_id=user_id,
        ).exists()

    def _check_project_access(self, slug, project_id, user_id):
        return ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member_id=user_id,
            role__gte=15,
            is_active=True,
        ).exists()

    def _check_move_permission(self, slug, source_identifier, target_identifier, user_id, move_type):
        if move_type == MoveActionEnum.PROJECT_TO_PROJECT.value:
            # Validate project access for both source and target
            if not self._check_project_access(slug=slug, project_id=source_identifier, user_id=user_id):
                return False
            if not self._check_project_access(slug=slug, project_id=target_identifier, user_id=user_id):
                return False
            return True

        elif move_type == MoveActionEnum.TEAMSPACE_TO_TEAMSPACE.value:
            # Validate teamspace access for both source and target
            if not self._check_teamspace_access(slug=slug, teamspace_id=source_identifier, user_id=user_id):
                return False
            if not self._check_teamspace_access(slug, target_identifier, user_id):
                return False

            return True

        elif move_type == MoveActionEnum.WORKSPACE_TO_PROJECT.value:
            # workspace permission is checked in the permission layer
            if not self._check_project_access(slug=slug, project_id=target_identifier, user_id=user_id):
                return False
            return True

        elif move_type == MoveActionEnum.PROJECT_TO_WORKSPACE.value:
            if not self._check_project_access(slug=slug, project_id=source_identifier, user_id=user_id):
                return False
            return True

        elif move_type == MoveActionEnum.TEAMSPACE_TO_PROJECT.value:
            if not self._check_teamspace_access(slug=slug, teamspace_id=source_identifier, user_id=user_id):
                return False
            if not self._check_project_access(slug=slug, project_id=target_identifier, user_id=user_id):
                return False
            return True

        elif move_type == MoveActionEnum.PROJECT_TO_TEAMSPACE.value:
            if not self._check_project_access(slug=slug, project_id=source_identifier, user_id=user_id):
                return False
            if not self._check_teamspace_access(slug=slug, teamspace_id=target_identifier, user_id=user_id):
                return False
            return True

        elif move_type == MoveActionEnum.WORKSPACE_TO_TEAMSPACE.value:
            # workspace permission is checked in the permission layer
            if not self._check_teamspace_access(slug=slug, teamspace_id=target_identifier, user_id=user_id):
                return False
            return True

        elif move_type == MoveActionEnum.TEAMSPACE_TO_WORKSPACE.value:
            # workspace permission is checked in the permission layer
            if not self._check_teamspace_access(slug=slug, teamspace_id=source_identifier, user_id=user_id):
                return False
            return True

        else:
            return False

    @check_feature_flag(FeatureFlag.MOVE_PAGES)
    @can(WikiPermissions.EDIT)
    def post(self, request, slug, page_id):
        move_type = request.data.get("move_type")
        source_identifier = request.data.get("source_identifier")
        target_identifier = request.data.get("target_identifier")

        # Validate that all required fields are provided
        if not all([move_type, source_identifier, target_identifier]):
            return Response(
                {"error": "All fields (move_type, source_identifier, target_identifier) are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate move type
        if move_type not in [action.value for action in MoveActionEnum]:
            return Response(
                {"error": "Invalid move type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = request.user.id

        # Get the page
        page = Page.objects.get(id=page_id, workspace__slug=slug)
        workspace_id = page.workspace_id
        old_page_parent_id = page.parent_id if page.parent_id else None

        # Validate page state
        if page.is_locked:
            return Response({"error": "Cannot move locked page"}, status=status.HTTP_400_BAD_REQUEST)

        if page.archived_at:
            return Response(
                {"error": "Cannot move archived page"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check the move permission if the user is allowed to move the page to the destination
        if not self._check_move_permission(
            slug=slug,
            source_identifier=source_identifier,
            target_identifier=target_identifier,
            user_id=user_id,
            move_type=move_type,
        ):
            return Response(
                {"error": "You are not allowed to move the page"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if page.parent_id:
            # while moving the page just null the parent id
            page.parent_id = None
            page.save()

        # transfer all the remaining entities to the new entities.
        if move_type in [
            MoveActionEnum.PROJECT_TO_PROJECT.value,
            MoveActionEnum.WORKSPACE_TO_PROJECT.value,
            MoveActionEnum.TEAMSPACE_TO_PROJECT.value,
        ]:
            if move_type == MoveActionEnum.TEAMSPACE_TO_PROJECT.value:
                unlink_pages_from_teamspace([page_id], workspace_id)

            if move_type == MoveActionEnum.WORKSPACE_TO_PROJECT.value:
                remove_pages_from_workspace_level([page_id], workspace_id, user_id)
                PageCollection.objects.filter(page_id=page_id, workspace_id=workspace_id).delete()

            if move_type == MoveActionEnum.PROJECT_TO_PROJECT.value:
                unlink_pages_from_project([page_id], workspace_id)

            link_pages_to_project([page_id], target_identifier, workspace_id, user_id)

            move_entities_to_project([page_id], slug, user_id, target_identifier)

        if move_type in [
            MoveActionEnum.PROJECT_TO_WORKSPACE.value,
            MoveActionEnum.TEAMSPACE_TO_WORKSPACE.value,
        ]:
            if move_type == MoveActionEnum.TEAMSPACE_TO_WORKSPACE.value:
                unlink_pages_from_teamspace([page_id], workspace_id)

            if move_type == MoveActionEnum.PROJECT_TO_WORKSPACE.value:
                unlink_pages_from_project([page_id], workspace_id)

            make_pages_workspace_level([page_id], workspace_id, user_id)

            move_entities_to_workspace([page_id], slug, user_id)

        if move_type in [
            MoveActionEnum.PROJECT_TO_TEAMSPACE.value,
            MoveActionEnum.TEAMSPACE_TO_TEAMSPACE.value,
            MoveActionEnum.WORKSPACE_TO_TEAMSPACE.value,
        ]:
            if move_type == MoveActionEnum.PROJECT_TO_TEAMSPACE.value:
                unlink_pages_from_project([page_id], workspace_id)

            if move_type == MoveActionEnum.TEAMSPACE_TO_TEAMSPACE.value:
                unlink_pages_from_teamspace([page_id], workspace_id)

            if move_type == MoveActionEnum.WORKSPACE_TO_TEAMSPACE.value:
                remove_pages_from_workspace_level([page_id], workspace_id, user_id)
                PageCollection.objects.filter(page_id=page_id, workspace_id=workspace_id).delete()

            link_pages_to_teamspace([page_id], target_identifier, workspace_id, user_id)

            move_entities_to_teamspace([page_id], slug, user_id, target_identifier)

        # update the corresponding sub pages
        nested_page_update.delay(
            page_id=page_id,
            action=PageAction.MOVED,
            slug=slug,
            user_id=user_id,
            extra={
                "old_page_parent_id": old_page_parent_id,
                "move_type": move_type,
                "new_entity_identifier": target_identifier,
            },
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
