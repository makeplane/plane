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
from plane.graphql.types.feature_flag import FeatureFlagType
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
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def feature_flag(
        self, info: Info, slug: str
    ) -> Optional[FeatureFlagType]:
        feature_flags = await fetch_feature_flags(slug, info.context.user.id)
        feature_flags = list(feature_flags)[0]
        return FeatureFlagType(
            bulk_ops=feature_flags.get("BULK_OPS", False),
            bulk_ops_advanced=feature_flags.get("BULK_OPS_ADVANCED", False),
            collaboration_cursor=feature_flags.get(
                "COLLABORATION_CURSOR", False
            ),
            editor_ai_ops=feature_flags.get("EDITOR_AI_OPS", False),
            estimate_with_time=feature_flags.get("ESTIMATE_WITH_TIME", False),
            issue_type_display=feature_flags.get("ISSUE_TYPE_DISPLAY", False),
            issue_type_settings=feature_flags.get(
                "ISSUE_TYPE_SETTINGS", False
            ),
            oidc_saml_auth=feature_flags.get("OIDC_SAML_AUTH", False),
            page_issue_embeds=feature_flags.get("PAGE_ISSUE_EMBEDS", False),
            page_publish=feature_flags.get("PAGE_PUBLISH", False),
            view_access_private=feature_flags.get(
                "VIEW_ACCESS_PRIVATE", False
            ),
            view_lock=feature_flags.get("VIEW_LOCK", False),
            view_publish=feature_flags.get("VIEW_PUBLISH", False),
            workspace_active_cycles=feature_flags.get(
                "WORKSPACE_ACTIVE_CYCLES", False
            ),
            workspace_pages=feature_flags.get("WORKSPACE_PAGES", False),
            issue_worklog=feature_flags.get("ISSUE_WORKLOG", False),
            project_grouping=feature_flags.get("PROJECT_GROUPING", False),
            active_cycle_pro=feature_flags.get("ACTIVE_CYCLE_PRO", False),
            no_load=feature_flags.get("NO_LOAD", False),
            file_size_limit_pro=feature_flags.get(
                "FILE_SIZE_LIMIT_PRO", False
            ),
            pi_chat=feature_flags.get("PI_CHAT", False),
            pi_dedupe=feature_flags.get("PI_DEDUPE", False),
            # ====== silo integrations ======
            silo_importers=feature_flags.get("SILO_IMPORTERS", False),
            silo_integrations=feature_flags.get("SILO_INTEGRATIONS", False),
            jira_importer=feature_flags.get("JIRA_IMPORTER", False),
            jira_issue_types_importer=feature_flags.get(
                "JIRA_ISSUE_TYPES_IMPORTER", False
            ),
            linear_importer=feature_flags.get("LINEAR_IMPORTER", False),
            linear_teams_importer=feature_flags.get(
                "LINEAR_TEAMS_IMPORTER", False
            ),
            asana_importer=feature_flags.get("ASANA_IMPORTER", False),
            asana_issue_properties_importer=feature_flags.get(
                "ASANA_ISSUE_PROPERTIES_IMPORTER", False
            ),
            github_integration=feature_flags.get("GITHUB_INTEGRATION", False),
            gitlab_integration=feature_flags.get("GITLAB_INTEGRATION", False),
            slack_integration=feature_flags.get("SLACK_INTEGRATION", False),
            # ====== mobile specific flags ======
            pi_chat_mobile=feature_flags.get("PI_CHAT_MOBILE", False),
            pi_dedupe_mobile=feature_flags.get("PI_DEDUPE_MOBILE", False),
        )
