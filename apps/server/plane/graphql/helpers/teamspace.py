# Python Imports
from typing import Optional

# Third-Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Local Imports
from plane.ee.models import TeamspaceMember, TeamspaceProject, WorkspaceFeature
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.teamspace import TeamspaceHelperObjectType, TeamspaceHelperType
from plane.graphql.utils.feature_flag import _validate_feature_flag


def is_teamspace_feature_flagged(workspace_slug: str, user_id: str) -> bool:
    feature_key = FeatureFlagsTypesEnum.TEAMSPACES.value
    return _validate_feature_flag(
        workspace_slug=workspace_slug,
        feature_key=feature_key,
        user_id=user_id,
    )


def is_teamspace_enabled(workspace_slug: str) -> bool:
    return WorkspaceFeature.objects.filter(
        workspace__slug=workspace_slug, is_teams_enabled=True
    ).exists()


def project_member_filter_via_teamspaces(
    user_id: str,
    workspace_slug: str,
    related_field: Optional[str] = "project_id",
    query: Optional[dict] = None,
    filters: Optional[dict] = None,
    is_many_to_many: Optional[bool] = False,
) -> TeamspaceHelperType:
    teamspace_feature_flagged = is_teamspace_feature_flagged(
        workspace_slug=workspace_slug, user_id=user_id
    )

    teamspace_enabled = is_teamspace_enabled(workspace_slug)

    if query is None:
        common_base_query = Q(
            project__project_projectmember__member_id=user_id,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
    else:
        common_base_query = Q(**query)

    if filters is not None:
        common_base_query = common_base_query | Q(**filters)

    if teamspace_feature_flagged and teamspace_enabled:
        # Get all team ids where the user is a member
        teamspace_ids = TeamspaceMember.objects.filter(
            member_id=user_id, workspace__slug=workspace_slug
        ).values_list("team_space_id", flat=True)

        # Get all the projects in the respective teamspaces
        teamspace_project = TeamspaceProject.objects.filter(
            team_space_id__in=teamspace_ids,
            project__archived_at__isnull=True,
        ).values_list("team_space_id", "project_id")
        teamspace_project_details = [
            TeamspaceHelperObjectType(
                id=str(team_space_id), project_ids=[str(project_id)]
            )
            for team_space_id, project_id in list(teamspace_project)
        ]
        teamspace_project_ids = [
            str(project_id) for _, project_id in list(teamspace_project)
        ]

        if len(teamspace_project_ids) > 0:
            if is_many_to_many:
                teamspace_filter = Q(**{f"{related_field}__in": teamspace_project_ids})
            else:
                teamspace_filter = Q(**{f"{related_field}__in": teamspace_project_ids})
            combined_query = teamspace_filter | common_base_query
            return TeamspaceHelperType(
                is_teamspace_enabled=teamspace_enabled,
                is_teamspace_feature_flagged=teamspace_feature_flagged,
                query=combined_query,
                teamspace_ids=teamspace_ids,
                teamspace_project_ids=teamspace_project_ids,
                teamspaces=teamspace_project_details,
            )
        else:
            return TeamspaceHelperType(
                is_teamspace_enabled=teamspace_enabled,
                is_teamspace_feature_flagged=teamspace_feature_flagged,
                query=common_base_query,
                teamspace_ids=None,
                teamspace_project_ids=None,
                teamspaces=None,
            )

    return TeamspaceHelperType(
        is_teamspace_enabled=teamspace_enabled,
        is_teamspace_feature_flagged=teamspace_feature_flagged,
        query=common_base_query,
        teamspace_ids=None,
        teamspace_project_ids=None,
        teamspaces=None,
    )


@sync_to_async
def is_teamspace_feature_flagged_async(workspace_slug: str, user_id: str) -> bool:
    return is_teamspace_feature_flagged(workspace_slug, user_id)


@sync_to_async
def is_teamspace_enabled_async(workspace_slug: str) -> bool:
    return is_teamspace_enabled(workspace_slug)


@sync_to_async
def project_member_filter_via_teamspaces_async(
    user_id: str,
    workspace_slug: str,
    related_field: Optional[str] = "project_id",
    query: Optional[dict] = None,
    filters: Optional[dict] = None,
    is_many_to_many: Optional[bool] = False,
) -> TeamspaceHelperType:
    return project_member_filter_via_teamspaces(
        user_id=user_id,
        workspace_slug=workspace_slug,
        related_field=related_field,
        query=query,
        filters=filters,
        is_many_to_many=is_many_to_many,
    )
