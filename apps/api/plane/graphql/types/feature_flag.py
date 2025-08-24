# Python imports
from enum import Enum

# Strawberry imports
import strawberry


class FeatureFlagsTypesEnum(Enum):
    """Enumeration of supported feature flags types."""

    # OIDC & SAML
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"

    # Workspace
    HOME_ADVANCED = "HOME_ADVANCED"
    INBOX_STACKING = "INBOX_STACKING"
    WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES"
    # Customers
    CUSTOMERS = "CUSTOMERS"
    # Initiatives
    INITIATIVES = "INITIATIVES"
    # Teamspaces
    TEAMSPACES = "TEAMSPACES"
    # Epics
    EPICS = "EPICS"
    # Templates
    PROJECT_TEMPLATES = "PROJECT_TEMPLATES"
    PAGE_TEMPLATES = "PAGE_TEMPLATES"
    PROJECT_TEMPLATES_PUBLISH = "PROJECT_TEMPLATES_PUBLISH"
    # Views
    VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE"
    VIEW_LOCK = "VIEW_LOCK"
    VIEW_PUBLISH = "VIEW_PUBLISH"

    # Project
    PROJECT_OVERVIEW = "PROJECT_OVERVIEW"
    PROJECT_GROUPING = "PROJECT_GROUPING"
    PROJECT_UPDATES = "PROJECT_UPDATES"
    # Bulk Operations
    BULK_OPS_ONE = "BULK_OPS_ONE"
    BULK_OPS_PRO = "BULK_OPS_PRO"
    # Cycle
    CYCLE_MANUAL_START_STOP = "CYCLE_MANUAL_START_STOP"
    CYCLE_PROGRESS_CHARTS = "CYCLE_PROGRESS_CHARTS"
    # work item
    ISSUE_TYPES = "ISSUE_TYPES"
    ISSUE_WORKLOG = "ISSUE_WORKLOG"
    WORKITEM_TEMPLATES = "WORKITEM_TEMPLATES"
    WORK_ITEM_CONVERSION = "WORK_ITEM_CONVERSION"
    COPY_WORK_ITEM = "COPY_WORK_ITEM"
    # Estimates
    ESTIMATE_WITH_TIME = "ESTIMATE_WITH_TIME"
    TIME_ESTIMATES = "TIME_ESTIMATES"
    # Workflows
    WORKFLOWS = "WORKFLOWS"

    # Intake
    INTAKE_SETTINGS = "INTAKE_SETTINGS"
    INTAKE_EMAIL = "INTAKE_EMAIL"
    INTAKE_FORM = "INTAKE_FORM"

    # pages and editor
    LINK_PAGES = "LINK_PAGES"
    COLLABORATION_CURSOR = "COLLABORATION_CURSOR"
    EDITOR_AI_OPS = "EDITOR_AI_OPS"
    PAGE_ISSUE_EMBEDS = "PAGE_ISSUE_EMBEDS"
    PAGE_PUBLISH = "PAGE_PUBLISH"
    MOVE_PAGES = "MOVE_PAGES"
    NESTED_PAGES = "NESTED_PAGES"
    WORKSPACE_PAGES = "WORKSPACE_PAGES"
    SHARED_PAGES = "SHARED_PAGES"
    EDITOR_ATTACHMENTS = "EDITOR_ATTACHMENTS"
    EDITOR_MATHEMATICS = "EDITOR_MATHEMATICS"

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
    CLICKUP_IMPORTER = "CLICKUP_IMPORTER"
    CLICKUP_ISSUE_PROPERTIES_IMPORTER = "CLICKUP_ISSUE_PROPERTIES_IMPORTER"
    NOTION_IMPORTER = "NOTION_IMPORTER"
    SILO_INTEGRATIONS = "SILO_INTEGRATIONS"
    GITHUB_INTEGRATION = "GITHUB_INTEGRATION"
    GITLAB_INTEGRATION = "GITLAB_INTEGRATION"
    SLACK_INTEGRATION = "SLACK_INTEGRATION"

    # File size limit
    FILE_SIZE_LIMIT_PRO = "FILE_SIZE_LIMIT_PRO"

    # Timeline dependency
    TIMELINE_DEPENDENCY = "TIMELINE_DEPENDENCY"

    # PI
    PI_CHAT = "PI_CHAT"
    PI_DEDUPE = "PI_DEDUPE"

    # Mobile specific flags
    PI_CHAT_MOBILE = "PI_CHAT_MOBILE"
    PI_DEDUPE_MOBILE = "PI_DEDUPE_MOBILE"

    # advanced search
    ADVANCED_SEARCH = "ADVANCED_SEARCH"

    def __str__(self) -> str:
        return self.value


@strawberry.type
class FeatureFlagType:
    # OIDC & SAML
    oidc_saml_auth: bool

    # Workspace
    home_advanced: bool
    inbox_stacking: bool
    workspace_active_cycles: bool
    # Customers
    customers: bool
    # Initiatives
    initiatives: bool
    # Teamspaces
    teamspaces: bool
    # Epics
    epics: bool
    # Templates
    project_templates: bool
    page_templates: bool
    project_templates_publish: bool
    # Views
    view_access_private: bool
    view_lock: bool
    view_publish: bool

    # Project
    project_overview: bool
    project_grouping: bool
    project_updates: bool
    # Bulk Operations
    bulk_ops_one: bool
    bulk_ops_pro: bool
    # Cycle
    cycle_manual_start_stop: bool
    cycle_progress_charts: bool
    # Work item
    issue_types: bool
    issue_worklog: bool
    workitem_templates: bool
    work_item_conversion: bool
    copy_work_item: bool
    # Estimates
    estimate_with_time: bool
    time_estimates: bool
    # Workflows
    workflows: bool

    # Intake
    intake_settings: bool
    intake_email: bool
    intake_form: bool

    # Pages and editor
    link_pages: bool
    collaboration_cursor: bool
    editor_ai_ops: bool
    page_issue_embeds: bool
    page_publish: bool
    move_pages: bool
    nested_pages: bool
    workspace_pages: bool
    shared_pages: bool
    editor_attachments: bool
    editor_mathematics: bool

    # Silo importers and integrations
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
    clickup_importer: bool
    clickup_issue_properties_importer: bool
    notion_importer: bool
    silo_integrations: bool
    github_integration: bool
    gitlab_integration: bool
    slack_integration: bool

    # File size limit
    file_size_limit_pro: bool

    # Timeline dependency
    timeline_dependency: bool

    # PI
    pi_chat: bool
    pi_dedupe: bool

    # Mobile specific flags
    pi_chat_mobile: bool
    pi_dedupe_mobile: bool

    # advanced search
    advanced_search: bool
