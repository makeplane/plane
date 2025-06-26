# Python imports
from enum import Enum

# Strawberry imports
import strawberry


class FeatureFlagsTypesEnum(Enum):
    """Enumeration of supported feature flags types."""

    BULK_OPS_ONE = "BULK_OPS_ONE"
    BULK_OPS_PRO = "BULK_OPS_PRO"
    COLLABORATION_CURSOR = "COLLABORATION_CURSOR"
    EDITOR_AI_OPS = "EDITOR_AI_OPS"
    ESTIMATE_WITH_TIME = "ESTIMATE_WITH_TIME"
    ISSUE_TYPES = "ISSUE_TYPES"
    EPICS = "EPICS"
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"
    PAGE_ISSUE_EMBEDS = "PAGE_ISSUE_EMBEDS"
    PAGE_PUBLISH = "PAGE_PUBLISH"
    MOVE_PAGES = "MOVE_PAGES"
    VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE"
    VIEW_LOCK = "VIEW_LOCK"
    VIEW_PUBLISH = "VIEW_PUBLISH"
    WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES"
    WORKSPACE_PAGES = "WORKSPACE_PAGES"
    ISSUE_WORKLOG = "ISSUE_WORKLOG"
    PROJECT_GROUPING = "PROJECT_GROUPING"
    CYCLE_PROGRESS_CHARTS = "CYCLE_PROGRESS_CHARTS"
    FILE_SIZE_LIMIT_PRO = "FILE_SIZE_LIMIT_PRO"
    TIMELINE_DEPENDENCY = "TIMELINE_DEPENDENCY"
    TEAMSPACES = "TEAMSPACES"
    INBOX_STACKING = "INBOX_STACKING"
    PROJECT_OVERVIEW = "PROJECT_OVERVIEW"
    PROJECT_UPDATES = "PROJECT_UPDATES"
    CYCLE_MANUAL_START_STOP = "CYCLE_MANUAL_START_STOP"
    HOME_ADVANCED = "HOME_ADVANCED"
    WORKFLOWS = "WORKFLOWS"
    CUSTOMERS = "CUSTOMERS"
    INTAKE_SETTINGS = "INTAKE_SETTINGS"
    INITIATIVES = "INITIATIVES"
    PI_CHAT = "PI_CHAT"
    PI_DEDUPE = "PI_DEDUPE"
    NESTED_PAGES = "NESTED_PAGES"

    # Silo importers and integrations
    SILO = "SILO"
    SILO_IMPORTERS = "SILO_IMPORTERS"
    FLATFILE_IMPORTER = "FLATFILE_IMPORTER"
    JIRA_IMPORTER = "JIRA_IMPORTER"
    JIRA_ISSUE_TYPES_IMPORTER = "JIRA_ISSUE_TYPES_IMPORTER"
    JIRA_SERVER_IMPORTER = "JIRA_SERVER_IMPORTER"
    JIRA_SERVER_ISSUE_TYPES_IMPORTER = "JIRA_SERVER_ISSUE_TYPES_IMPORTER"
    LINEAR_IMPORTER = "LINEAR_IMPORTER"
    LINEAR_TEAMS_IMPORTER = "LINEAR_TEAMS_IMPORTER"
    ASANA_IMPORTER = "ASANA_IMPORTER"
    ASANA_ISSUE_PROPERTIES_IMPORTER = "ASANA_ISSUE_PROPERTIES_IMPORTER"
    SILO_INTEGRATIONS = "SILO_INTEGRATIONS"
    GITHUB_INTEGRATION = "GITHUB_INTEGRATION"
    GITLAB_INTEGRATION = "GITLAB_INTEGRATION"
    SLACK_INTEGRATION = "SLACK_INTEGRATION"

    # Mobile specific flags
    PI_CHAT_MOBILE = "PI_CHAT_MOBILE"
    PI_DEDUPE_MOBILE = "PI_DEDUPE_MOBILE"

    def __str__(self) -> str:
        return self.value


@strawberry.type
class FeatureFlagType:
    bulk_ops_one: bool
    bulk_ops_pro: bool
    collaboration_cursor: bool
    editor_ai_ops: bool
    estimate_with_time: bool
    issue_types: bool
    epics: bool
    oidc_saml_auth: bool
    page_issue_embeds: bool
    page_publish: bool
    move_pages: bool
    view_access_private: bool
    view_lock: bool
    view_publish: bool
    workspace_active_cycles: bool
    workspace_pages: bool
    issue_worklog: bool
    project_grouping: bool
    cycle_progress_charts: bool
    file_size_limit_pro: bool
    timeline_dependency: bool
    teamspaces: bool
    inbox_stacking: bool
    project_overview: bool
    project_updates: bool
    cycle_manual_start_stop: bool
    home_advanced: bool
    workflows: bool
    customers: bool
    intake_settings: bool
    initiatives: bool
    pi_chat: bool
    pi_dedupe: bool
    nested_pages: bool
    # ====== silo integrations ======
    silo: bool
    silo_importers: bool
    flatfile_importer: bool
    jira_importer: bool
    jira_issue_types_importer: bool
    jira_server_importer: bool
    jira_server_issue_types_importer: bool
    linear_importer: bool
    linear_teams_importer: bool
    asana_importer: bool
    asana_issue_properties_importer: bool
    silo_integrations: bool
    github_integration: bool
    gitlab_integration: bool
    slack_integration: bool
    # ====== mobile specific flags ======
    pi_chat_mobile: bool
    pi_dedupe_mobile: bool
