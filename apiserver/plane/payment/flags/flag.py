from enum import Enum


class FeatureFlag(Enum):
    # Workspace level active cycles
    WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES"
    # Bulk operations on issues
    BULK_OPS = "BULK_OPS"
    # Make views public or private
    VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE"
    # View publish
    VIEW_PUBLISH = "VIEW_PUBLISH"
    # View Locking and unlocking
    VIEW_LOCKING = "VIEW_LOCKING"
    # Workspace level pages
    WORKSPACE_PAGES = "WORKSPACE_PAGES"
    # OIDC SAML Auth
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"
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
