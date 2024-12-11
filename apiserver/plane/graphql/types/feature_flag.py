# Strawberry imports
import strawberry


@strawberry.type
class FeatureFlagType:
    bulk_ops: bool
    bulk_ops_advanced: bool
    collaboration_cursor: bool
    editor_ai_ops: bool
    estimate_with_time: bool
    issue_type_display: bool
    issue_type_settings: bool
    oidc_saml_auth: bool
    page_issue_embeds: bool
    page_publish: bool
    view_access_private: bool
    view_lock: bool
    view_publish: bool
    workspace_active_cycles: bool
    workspace_pages: bool
    issue_worklog: bool
    project_grouping: bool
    active_cycle_pro: bool
    no_load: bool
    file_size_limit_pro: bool
    pi_chat: bool
    pi_dedupe: bool

    # ====== silo integrations ======
    silo_importers: bool
    silo_integrations: bool
    jira_importer: bool
    jira_issue_types_importer: bool
    linear_importer: bool
    linear_teams_importer: bool
    asana_importer: bool
    asana_issue_properties_importer: bool
    github_integration: bool
    gitlab_integration: bool
    slack_integration: bool

    # ====== mobile specific flags ======
    pi_chat_mobile: bool
    pi_dedupe_mobile: bool
