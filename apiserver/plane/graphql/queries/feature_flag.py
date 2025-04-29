# Third-Party Imports
import strawberry
import requests
from typing import Optional

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.conf import settings

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum, FeatureFlagType
from plane.graphql.permissions.workspace import WorkspaceBasePermission


# fetching the version check query
@sync_to_async
def fetch_feature_flags(slug: str, user_id: strawberry.ID):
    url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/"
    json = {"workspace_slug": slug, "user_id": str(user_id)}
    headers = {
        "content-type": "application/json",
        "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
    }
    response = requests.post(url, json=json, headers=headers)
    response.raise_for_status()
    return response.json().values()


@strawberry.type
class FeatureFlagQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def feature_flag(self, info: Info, slug: str) -> Optional[FeatureFlagType]:
        feature_flags = await fetch_feature_flags(slug, info.context.user.id)
        feature_flags = list(feature_flags)[0]

        return FeatureFlagType(
            bulk_ops_one=feature_flags.get(
                FeatureFlagsTypesEnum.BULK_OPS_ONE.value, False
            ),
            bulk_ops_pro=feature_flags.get(
                FeatureFlagsTypesEnum.BULK_OPS_PRO.value, False
            ),
            collaboration_cursor=feature_flags.get(
                FeatureFlagsTypesEnum.COLLABORATION_CURSOR.value, False
            ),
            editor_ai_ops=feature_flags.get(
                FeatureFlagsTypesEnum.EDITOR_AI_OPS.value, False
            ),
            estimate_with_time=feature_flags.get(
                FeatureFlagsTypesEnum.ESTIMATE_WITH_TIME.value, False
            ),
            issue_types=feature_flags.get(
                FeatureFlagsTypesEnum.ISSUE_TYPES.value, False
            ),
            epics=feature_flags.get(FeatureFlagsTypesEnum.EPICS.value, False),
            oidc_saml_auth=feature_flags.get(
                FeatureFlagsTypesEnum.OIDC_SAML_AUTH.value, False
            ),
            page_issue_embeds=feature_flags.get(
                FeatureFlagsTypesEnum.PAGE_ISSUE_EMBEDS.value, False
            ),
            page_publish=feature_flags.get(
                FeatureFlagsTypesEnum.PAGE_PUBLISH.value, False
            ),
            move_pages=feature_flags.get(FeatureFlagsTypesEnum.MOVE_PAGES.value, False),
            view_access_private=feature_flags.get(
                FeatureFlagsTypesEnum.VIEW_ACCESS_PRIVATE.value, False
            ),
            view_lock=feature_flags.get(FeatureFlagsTypesEnum.VIEW_LOCK.value, False),
            view_publish=feature_flags.get(
                FeatureFlagsTypesEnum.VIEW_PUBLISH.value, False
            ),
            workspace_active_cycles=feature_flags.get(
                FeatureFlagsTypesEnum.WORKSPACE_ACTIVE_CYCLES.value, False
            ),
            workspace_pages=feature_flags.get(
                FeatureFlagsTypesEnum.WORKSPACE_PAGES.value, False
            ),
            issue_worklog=feature_flags.get(
                FeatureFlagsTypesEnum.ISSUE_WORKLOG.value, False
            ),
            project_grouping=feature_flags.get(
                FeatureFlagsTypesEnum.PROJECT_GROUPING.value, False
            ),
            cycle_progress_charts=feature_flags.get(
                FeatureFlagsTypesEnum.CYCLE_PROGRESS_CHARTS.value, False
            ),
            file_size_limit_pro=feature_flags.get(
                FeatureFlagsTypesEnum.FILE_SIZE_LIMIT_PRO.value, False
            ),
            timeline_dependency=feature_flags.get(
                FeatureFlagsTypesEnum.TIMELINE_DEPENDENCY.value, False
            ),
            teamspaces=feature_flags.get(FeatureFlagsTypesEnum.TEAMSPACES.value, False),
            inbox_stacking=feature_flags.get(
                FeatureFlagsTypesEnum.INBOX_STACKING.value, False
            ),
            project_overview=feature_flags.get(
                FeatureFlagsTypesEnum.PROJECT_OVERVIEW.value, False
            ),
            project_updates=feature_flags.get(
                FeatureFlagsTypesEnum.PROJECT_UPDATES.value, False
            ),
            cycle_manual_start_stop=feature_flags.get(
                FeatureFlagsTypesEnum.CYCLE_MANUAL_START_STOP.value, False
            ),
            home_advanced=feature_flags.get(
                FeatureFlagsTypesEnum.HOME_ADVANCED.value, False
            ),
            workflows=feature_flags.get(FeatureFlagsTypesEnum.WORKFLOWS.value, False),
            customers=feature_flags.get(FeatureFlagsTypesEnum.CUSTOMERS.value, False),
            intake_settings=feature_flags.get(
                FeatureFlagsTypesEnum.INTAKE_SETTINGS.value, False
            ),
            initiatives=feature_flags.get(
                FeatureFlagsTypesEnum.INITIATIVES.value, False
            ),
            pi_chat=feature_flags.get(FeatureFlagsTypesEnum.PI_CHAT.value, False),
            pi_dedupe=feature_flags.get(FeatureFlagsTypesEnum.PI_DEDUPE.value, False),
            nested_pages=feature_flags.get(
                FeatureFlagsTypesEnum.NESTED_PAGES.value, False
            ),
            silo=feature_flags.get(FeatureFlagsTypesEnum.SILO.value, False),
            silo_importers=feature_flags.get(
                FeatureFlagsTypesEnum.SILO_IMPORTERS.value, False
            ),
            flatfile_importer=feature_flags.get(
                FeatureFlagsTypesEnum.FLATFILE_IMPORTER.value, False
            ),
            jira_importer=feature_flags.get(
                FeatureFlagsTypesEnum.JIRA_IMPORTER.value, False
            ),
            jira_issue_types_importer=feature_flags.get(
                FeatureFlagsTypesEnum.JIRA_ISSUE_TYPES_IMPORTER.value, False
            ),
            jira_server_importer=feature_flags.get(
                FeatureFlagsTypesEnum.JIRA_SERVER_IMPORTER.value, False
            ),
            jira_server_issue_types_importer=feature_flags.get(
                FeatureFlagsTypesEnum.JIRA_SERVER_ISSUE_TYPES_IMPORTER.value, False
            ),
            linear_importer=feature_flags.get(
                FeatureFlagsTypesEnum.LINEAR_IMPORTER.value, False
            ),
            linear_teams_importer=feature_flags.get(
                FeatureFlagsTypesEnum.LINEAR_TEAMS_IMPORTER.value, False
            ),
            asana_importer=feature_flags.get(
                FeatureFlagsTypesEnum.ASANA_IMPORTER.value, False
            ),
            asana_issue_properties_importer=feature_flags.get(
                FeatureFlagsTypesEnum.ASANA_ISSUE_PROPERTIES_IMPORTER.value, False
            ),
            silo_integrations=feature_flags.get(
                FeatureFlagsTypesEnum.SILO_INTEGRATIONS.value, False
            ),
            github_integration=feature_flags.get(
                FeatureFlagsTypesEnum.GITHUB_INTEGRATION.value, False
            ),
            gitlab_integration=feature_flags.get(
                FeatureFlagsTypesEnum.GITLAB_INTEGRATION.value, False
            ),
            slack_integration=feature_flags.get(
                FeatureFlagsTypesEnum.SLACK_INTEGRATION.value, False
            ),
            pi_chat_mobile=feature_flags.get(
                FeatureFlagsTypesEnum.PI_CHAT_MOBILE.value, False
            ),
            pi_dedupe_mobile=feature_flags.get(
                FeatureFlagsTypesEnum.PI_DEDUPE_MOBILE.value, False
            ),
        )
