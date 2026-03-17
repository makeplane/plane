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
    # Workspace additional layouts
    GLOBAL_VIEWS_CAL_BOARD = "GLOBAL_VIEWS_CAL_BOARD"
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
    # Milestones
    MILESTONES = "MILESTONES"
    # Automated Cycles
    AUTO_SCHEDULE_CYCLES = "AUTO_SCHEDULE_CYCLES"
    # Parallel Cycles
    PARALLEL_CYCLES = "PARALLEL_CYCLES"
    # Exports
    ADVANCED_EXPORTS = "ADVANCED_EXPORTS"
    # WORKSPACE_MEMBER_ACTIVITY
    WORKSPACE_MEMBER_ACTIVITY = "WORKSPACE_MEMBER_ACTIVITY"
    # Intake responsibility
    INTAKE_RESPONSIBILITY = "INTAKE_RESPONSIBILITY"
    # Intake form workitem types
    WORKITEM_TYPE_INTAKE_FORM = "WORKITEM_TYPE_INTAKE_FORM"
    # PI Chat
    AI_CHAT = "AI_CHAT"
    # Project member activity
    PROJECT_MEMBER_ACTIVITY = "PROJECT_MEMBER_ACTIVITY"
    # CLOUD_SSO
    CLOUD_SSO = "CLOUD_SSO"
    # IDP_GROUP_SYNC
    IDP_GROUP_SYNC = "IDP_GROUP_SYNC"
    # Workspace api token
    WORKSPACE_API_TOKEN = "WORKSPACE_API_TOKEN"
    # Import summary
    IMPORT_SUMMARY = "IMPORT_SUMMARY"
    # Multiple workflows
    MULTIPLE_WORKFLOWS = "MULTIPLE_WORKFLOWS"
    # Releases
    RELEASES = "RELEASES"
    # Formula properties
    WORKITEM_TYPE_FORMULA_FIELD = "WORKITEM_TYPE_FORMULA_FIELD"
    # Custom relations
    CUSTOM_RELATIONS = "CUSTOM_RELATIONS"
    # Manage Issue Subscribers
    MANAGE_ISSUE_SUBSCRIBERS = "MANAGE_ISSUE_SUBSCRIBERS"
    # Timeline dependency
    TIMELINE_DEPENDENCY = "TIMELINE_DEPENDENCY"


class AdminFeatureFlag(Enum):
    # OIDC SAML Auth
    OIDC_SAML_AUTH = "OIDC_SAML_AUTH"
    # LDAP Auth
    LDAP_AUTH = "LDAP_AUTH"
