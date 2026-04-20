/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Settings routes — wrapped in the (settings) layout.
 *
 * Contains workspace settings (general, members, billing, integrations, imports,
 * identity, etc.) and project settings (general, members, features, states,
 * labels, estimates, automations, epics, workflows, templates, etc.).
 */
export const settingsRoutes: RouteConfigEntry[] = [
  layout("./(all)/[workspaceSlug]/(settings)/layout.tsx", [
    // ====================================================================
    // WORKSPACE SETTINGS
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/layout.tsx", [
      // General
      route(":workspaceSlug/settings", "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/page.tsx"),
      route(
        ":workspaceSlug/settings/members",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/billing",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/billing/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/exports",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/webhooks",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/webhooks/:webhookId",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/[webhookId]/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/access-tokens",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/access-tokens/page.tsx"
      ),
      // Workspace Roles & Schemes
      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/workspace-roles-and-schemes/layout.tsx", [
        route(
          ":workspaceSlug/settings/workspace-roles-and-schemes",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/workspace-roles-and-schemes/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/workspace-roles-and-schemes/roles/:slug",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/workspace-roles-and-schemes/roles/[slug]/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/workspace-roles-and-schemes/schemes/create",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/workspace-roles-and-schemes/schemes/create/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/workspace-roles-and-schemes/schemes/:slug",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/workspace-roles-and-schemes/schemes/[slug]/page.tsx"
        ),
      ]),

      // Project Roles & Schemes
      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/project-roles-and-schemes/layout.tsx", [
        route(
          ":workspaceSlug/settings/project-roles-and-schemes",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/project-roles-and-schemes/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/project-roles-and-schemes/roles/:slug",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/project-roles-and-schemes/roles/[slug]/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/project-roles-and-schemes/schemes/create",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/project-roles-and-schemes/schemes/create/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/project-roles-and-schemes/schemes/:slug",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/project-roles-and-schemes/schemes/[slug]/page.tsx"
        ),
      ]),

      // Group Syncing
      route(
        ":workspaceSlug/settings/group-syncing",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/group-syncing/page.tsx"
      ),

      // Customers
      route(
        ":workspaceSlug/settings/customers",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/customers/page.tsx"
      ),

      // Releases
      route(
        ":workspaceSlug/settings/releases",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/releases/page.tsx"
      ),

      // Initiatives
      route(
        ":workspaceSlug/settings/initiatives",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/initiatives/page.tsx"
      ),

      // Plane Intelligence
      route(
        ":workspaceSlug/settings/plane-intelligence",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/plane-intelligence/page.tsx"
      ),

      // Project Configuration
      route(
        ":workspaceSlug/settings/project-configuration",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/project-configuration/page.tsx"
      ),

      // Connections
      route(
        ":workspaceSlug/settings/connections",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/connections/page.tsx"
      ),

      // Teamspaces
      route(
        ":workspaceSlug/settings/teamspaces",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/teamspaces/page.tsx"
      ),

      // Relations
      route(
        ":workspaceSlug/settings/relations",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/relations/page.tsx"
      ),

      // Worklogs
      route(
        ":workspaceSlug/settings/worklogs",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/worklogs/page.tsx"
      ),

      // Scripts / Runners
      route(
        ":workspaceSlug/settings/runner",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/runners/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/runner/scripts/new",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/runners/runner-scripts/new/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/runner/scripts/:scriptId",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/runners/runner-scripts/[scriptId]/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/runner/functions/new",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/runners/functions/new/page.tsx"
      ),
      route(
        ":workspaceSlug/settings/runner/functions/:functionId",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/runners/functions/[functionId]/page.tsx"
      ),

      // Templates
      route(
        ":workspaceSlug/settings/templates",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx"
      ),

      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/(templates)/layout.tsx", [
        route(
          ":workspaceSlug/settings/templates/page",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/(templates)/page/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/templates/project",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/(templates)/project/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/templates/project/:templateId/publish",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/(templates)/project/[templateId]/publish/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/templates/work-item",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/(templates)/work-item/page.tsx"
        ),
      ]),

      // Integrations
      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/layout.tsx", [
        // Integrations - List
        route(
          ":workspaceSlug/settings/integrations",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx"
        ),
        // Integrations - Create
        route(
          ":workspaceSlug/settings/integrations/create",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/create/page.tsx"
        ),

        // Integrations - App Management (Install/Edit)
        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/[appSlug]/layout.tsx", [
          route(
            ":workspaceSlug/settings/integrations/:appSlug/install",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/[appSlug]/install/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/:appSlug/edit",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/[appSlug]/edit/page.tsx"
          ),
        ]),

        // Specific Integration Routes
        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/layout.tsx", [
          route(
            ":workspaceSlug/settings/integrations/github",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/github/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/github-enterprise",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/github-enterprise/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/gitlab",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/gitlab/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/gitlab-enterprise",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/gitlab-enterprise/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/sentry",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/sentry/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/slack",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/slack/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/bitbucket-dc",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/bitbucket-dc/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/cursor",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/cursor/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/integrations/oauth-bridge",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/integrations/(integrations)/oauth-bridge/page.tsx"
          ),
        ]),
      ]),

      // Imports
      route(
        ":workspaceSlug/settings/imports",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/page.tsx"
      ),
      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/layout.tsx", [
        route(
          ":workspaceSlug/settings/imports/asana",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/asana/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/clickup",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/clickup/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/confluence",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/confluence/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/csv-import",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/csv-import/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/flatfile",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/flatfile/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/jira",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/jira/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/jira-server",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/jira-server/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/linear",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/linear/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/imports/notion",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/imports/(importers)/notion/page.tsx"
        ),
      ]),

      // Single Sign-On / Identity
      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/identity/layout.tsx", [
        route(
          ":workspaceSlug/settings/identity",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/identity/page.tsx"
        ),
        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/identity/(providers)/layout.tsx", [
          route(
            ":workspaceSlug/settings/identity/oidc",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/identity/(providers)/oidc/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/identity/saml",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/identity/(providers)/saml/page.tsx"
          ),
        ]),
      ]),

      // Work Item Types
      route(
        ":workspaceSlug/settings/work-item-types",
        "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/work-item-types/page.tsx"
      ),

      // Automations
      layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/automations/layout.tsx", [
        route(
          ":workspaceSlug/settings/automations",
          "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/automations/page.tsx"
        ),
        layout("./(all)/[workspaceSlug]/(settings)/settings/(workspace)/automations/[automationId]/layout.tsx", [
          route(
            ":workspaceSlug/settings/automations/:automationId",
            "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/automations/[automationId]/page.tsx"
          ),
        ]),
      ]),
    ]),

    // ====================================================================
    // PROJECT SETTINGS
    // ====================================================================

    layout("./(all)/[workspaceSlug]/(settings)/settings/projects/layout.tsx", [
      // No Projects available page
      route(":workspaceSlug/settings/projects", "./(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx"),

      // Project settings detail
      layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/layout.tsx", [
        // Project Settings (general)
        route(
          ":workspaceSlug/settings/projects/:projectId",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/page.tsx"
        ),
        // Project Members
        route(
          ":workspaceSlug/settings/projects/:projectId/members",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/members/page.tsx"
        ),
        // Project Features
        route(
          ":workspaceSlug/settings/projects/:projectId/features/cycles",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/cycles/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/projects/:projectId/features/modules",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/modules/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/projects/:projectId/features/views",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/views/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/projects/:projectId/features/pages",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/pages/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/projects/:projectId/features/intake",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/intake/page.tsx"
        ),
        // Project States
        route(
          ":workspaceSlug/settings/projects/:projectId/states",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/states/page.tsx"
        ),
        // Project Labels
        route(
          ":workspaceSlug/settings/projects/:projectId/labels",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/labels/page.tsx"
        ),
        // Project Estimates
        route(
          ":workspaceSlug/settings/projects/:projectId/estimates",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/estimates/page.tsx"
        ),
        // Project Automations
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/layout.tsx", [
          route(
            ":workspaceSlug/settings/projects/:projectId/automations",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/automations/page.tsx"
          ),
        ]),

        // Project Epics
        route(
          ":workspaceSlug/settings/projects/:projectId/epics",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/epics/page.tsx"
        ),
        // Project Updates
        route(
          ":workspaceSlug/settings/projects/:projectId/project-updates",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/project-updates/page.tsx"
        ),
        // Project Work Item Types
        route(
          ":workspaceSlug/settings/projects/:projectId/work-item-types",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/work-item-types/page.tsx"
        ),
        // Project Workflows
        route(
          ":workspaceSlug/settings/projects/:projectId/workflows",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/workflows/page.tsx"
        ),
        route(
          ":workspaceSlug/settings/projects/:projectId/workflows/:workflowId",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/workflows/(detail)/[workflowId]/page.tsx"
        ),
        // Project Worklogs
        route(
          ":workspaceSlug/settings/projects/:projectId/worklogs",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/worklogs/page.tsx"
        ),
        // Project Features - Time Tracking
        route(
          ":workspaceSlug/settings/projects/:projectId/features/time-tracking",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/time-tracking/page.tsx"
        ),
        // Project Features - Milestones
        route(
          ":workspaceSlug/settings/projects/:projectId/features/milestones",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/milestones/page.tsx"
        ),
        // Recurring Work Items
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/recurring-work-items/layout.tsx", [
          route(
            ":workspaceSlug/settings/projects/:projectId/recurring-work-items",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/recurring-work-items/page.tsx"
          ),
          layout(
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/recurring-work-items/(details)/layout.tsx",
            [
              route(
                ":workspaceSlug/settings/projects/:projectId/recurring-work-items/create",
                "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/recurring-work-items/(details)/create/page.tsx"
              ),
              route(
                ":workspaceSlug/settings/projects/:projectId/recurring-work-items/:recurringWorkItemId/update",
                "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/recurring-work-items/(details)/[recurringWorkItemId]/update/page.tsx"
              ),
            ]
          ),
        ]),
        // Project Templates
        route(
          ":workspaceSlug/settings/projects/:projectId/templates",
          "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/templates/page.tsx"
        ),
        layout("./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/templates/(templates)/layout.tsx", [
          route(
            ":workspaceSlug/settings/projects/:projectId/templates/page",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/templates/(templates)/page/page.tsx"
          ),
          route(
            ":workspaceSlug/settings/projects/:projectId/templates/work-item",
            "./(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/templates/(templates)/work-item/page.tsx"
          ),
        ]),
      ]),
    ]),
  ]),
];
