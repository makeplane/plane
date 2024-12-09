from enum import Enum


class FeatureFlag(Enum):
    # Workspace level active cycles
    WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES"
    # Bulk operations on issues
    BULK_OPS = "BULK_OPS"
    # Publish Views
    VIEW_PUBLISH = "VIEW_PUBLISH"
    # Make views public or private
    VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE"
    # View Locking and unlocking
    VIEW_LOCKING = "VIEW_LOCKING"
    # Workspace level pages
    WORKSPACE_PAGES = "WORKSPACE_PAGES"
    # Page level issue embeds
    PAGE_ISSUE_EMBEDS = "PAGE_ISSUE_EMBEDS"
    # Page Publish
    PAGE_PUBLISH = "PAGE_PUBLISH"
    # Estimate with time
    ESTIMATE_WITH_TIME = "ESTIMATE_WITH_TIME"
    # Issue list
    ISSUE_TYPE_DISPLAY = "ISSUE_TYPE_DISPLAY"
    # Settings
    ISSUE_TYPE_SETTINGS = "ISSUE_TYPE_SETTINGS"
    # Issue Worklog
    ISSUE_WORKLOG = "ISSUE_WORKLOG"
    # Project Grouping
    PROJECT_GROUPING = "PROJECT_GROUPING"
    # Active cycle progress
    ACTIVE_CYCLE_PRO = "ACTIVE_CYCLE_PRO"
    # Pro file size limit
    FILE_SIZE_LIMIT_PRO = "FILE_SIZE_LIMIT_PRO"
    # Intake publish
    INTAKE_PUBLISH = "INTAKE_PUBLISH"
    # Intake settings
    INTAKE_SETTINGS = "INTAKE_SETTINGS"
    # Workflows
    WORKFLOWS = "WORKFLOWS"


class AdminFeatureFlag(Enum):
    # OIDC SAML Auth
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"
