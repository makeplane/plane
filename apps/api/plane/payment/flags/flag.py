from enum import Enum


class FeatureFlag(Enum):
    # Workspace level active cycles
    WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES"
    # Bulk operations on issues
    BULK_OPS_ONE = "BULK_OPS_ONE"
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
    # Issue types
    ISSUE_TYPES = "ISSUE_TYPES"
    # Issue Worklog
    ISSUE_WORKLOG = "ISSUE_WORKLOG"
    # Project Grouping
    PROJECT_GROUPING = "PROJECT_GROUPING"
    # Active cycle progress
    CYCLE_PROGRESS_CHARTS = "CYCLE_PROGRESS_CHARTS"
    # Pro file size limit
    FILE_SIZE_LIMIT_PRO = "FILE_SIZE_LIMIT_PRO"

    # Intake form
    INTAKE_FORM = "INTAKE_FORM"
    # Intake email
    INTAKE_EMAIL = "INTAKE_EMAIL"
    # Initiatives
    INITIATIVES = "INITIATIVES"
    # Team space
    TEAMSPACES = "TEAMSPACES"
    # Epics
    EPICS = "EPICS"
    EPIC_OVERVIEW = "EPIC_OVERVIEW"
    # Workflows
    WORKFLOWS = "WORKFLOWS"
    # Project Overview
    PROJECT_OVERVIEW = "PROJECT_OVERVIEW"
    # Inbox Stacking
    INBOX_STACKING = "INBOX_STACKING"
    # Silo
    SILO = "SILO"
    # Silo Imports
    SILO_IMPORTERS = "SILO_IMPORTERS"
    # Silo integrations
    SILO_INTEGRATIONS = "SILO_INTEGRATIONS"
    # MOVE_PAGES
    MOVE_PAGES = "MOVE_PAGES"
    # workitem templates
    WORKITEM_TEMPLATES = "WORKITEM_TEMPLATES"
    # Page templates
    PAGE_TEMPLATES = "PAGE_TEMPLATES"
    # Advanced search with elasticsearch
    ADVANCED_SEARCH = "ADVANCED_SEARCH"
    # Customers
    CUSTOMERS = "CUSTOMERS"
    # Dashboards
    DASHBOARDS = "DASHBOARDS"
    # Nested pages
    NESTED_PAGES = "NESTED_PAGES"
    # Project Templates
    PROJECT_TEMPLATES = "PROJECT_TEMPLATES"
    # Workspace gantt view
    GLOBAL_VIEWS_TIMELINE = "GLOBAL_VIEWS_TIMELINE"
    # Shared Pages
    SHARED_PAGES = "SHARED_PAGES"
    # Copy Work Item
    COPY_WORK_ITEM = "COPY_WORK_ITEM"
    # Analytics
    ANALYTICS_ADVANCED = "ANALYTICS_ADVANCED"
    # Notion Importer
    NOTION_IMPORTER = "NOTION_IMPORTER"
    # Link Pages
    LINK_PAGES = "LINK_PAGES"
    # Page Comments
    PAGE_COMMENTS = "PAGE_COMMENTS"
    # Automations
    PROJECT_AUTOMATIONS = "PROJECT_AUTOMATIONS"
    # Recurring Work Items
    RECURRING_WORKITEMS = "RECURRING_WORKITEMS"


class AdminFeatureFlag(Enum):
    # OIDC SAML Auth
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"
