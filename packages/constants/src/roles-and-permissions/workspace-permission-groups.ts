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

// plane imports
import type { WorkspacePermissionResource } from "@plane/types";
// local imports
import type { PermissionMatrixGroup, ResourcePermissions } from "./matrix-types";
import { buildPermissionGroups } from "./permission-matrix-utils";

// ---------------------------------------------------------------------------
// Local group definition type
// ---------------------------------------------------------------------------

type WorkspaceGroupDef = {
  titleKey: string;
  descriptionKey: string;
  order: number;
  /**
   * Each resource key must be a valid WorkspacePermissionResource.
   * Each action key must be a valid action for that resource (compile error otherwise).
   * Partial — only actions we want to surface in the UI need to be listed.
   */
  resources: { [R in WorkspacePermissionResource]?: ResourcePermissions<R> };
};

// ---------------------------------------------------------------------------
// i18n key prefix
// ---------------------------------------------------------------------------

const P = "workspace_settings.settings.roles_and_permissions.psets.workspace" as const;
const F = "workspace_settings.settings.roles_and_permissions.psets.ui.folded_rows" as const;

// ---------------------------------------------------------------------------
// Workspace permission groups
//
// Render order = key insertion order within each resource's permissions object.
// To add a new group: add a new key to WORKSPACE_GROUPS.
// To add a new permission: add a new action key inside the resource block.
// To add a new resource to a group: add the resource key inside the group's `resources`.
// ---------------------------------------------------------------------------

const WORKSPACE_GROUPS: Record<string, WorkspaceGroupDef> = {
  workspace_settings: {
    titleKey: `${P}.workspace_settings.title`,
    descriptionKey: `${P}.workspace_settings.description`,
    order: 1,
    resources: {
      workspace: {
        view: { labelKey: `${P}.workspace_settings.workspace.view.label`, alwaysEnabled: true },
        edit: { labelKey: `${P}.workspace_settings.workspace.edit.label`, prerequisites: ["workspace:view"] },
        manage: { labelKey: `${P}.workspace_settings.workspace.manage.label`, prerequisites: ["workspace:view"] },
        invite: { labelKey: `${P}.workspace_settings.workspace.invite.label`, prerequisites: ["workspace:view"] },
        delete: { labelKey: `${P}.workspace_settings.workspace.delete.label`, prerequisites: ["workspace:view"] },
        transfer: { labelKey: `${P}.workspace_settings.workspace.transfer.label`, prerequisites: ["workspace:view"] },
      },
    },
  },

  member_management: {
    titleKey: `${P}.member_management.title`,
    descriptionKey: `${P}.member_management.description`,
    order: 2,
    resources: {
      workspace_member: {
        view: { labelKey: `${P}.member_management.workspace_member.view.label` },
        invite: {
          labelKey: `${P}.member_management.workspace_member.invite.label`,
          prerequisites: ["workspace_member:view"],
        },
        edit: {
          labelKey: `${P}.member_management.workspace_member.edit.label`,
          prerequisites: ["workspace_member:view"],
        },
        import: {
          labelKey: `${P}.member_management.workspace_member.import.label`,
          prerequisites: ["workspace_member:view"],
        },
        change_role: {
          labelKey: `${P}.member_management.workspace_member.change_role.label`,
          prerequisites: ["workspace_member:view"],
        },
        remove: {
          labelKey: `${P}.member_management.workspace_member.remove.label`,
          prerequisites: ["workspace_member:view"],
        },
      },
    },
  },

  project_management: {
    titleKey: `${P}.project_management.title`,
    descriptionKey: `${P}.project_management.description`,
    order: 3,
    resources: {
      project: {
        browse: { labelKey: `${P}.project_management.project.browse.label` },
        view: { labelKey: `${P}.project_management.project.view.label`, alwaysEnabled: true },
        create: { labelKey: `${P}.project_management.project.create.label` },
        edit: { labelKey: `${P}.project_management.project.edit.label`, prerequisites: ["project:view"] },
        react: { labelKey: `${P}.project_management.project.react.label`, prerequisites: ["project:view"] },
        publish: { labelKey: `${P}.project_management.project.publish.label`, prerequisites: ["project:view"] },
        archive: { labelKey: `${P}.project_management.project.archive.label`, prerequisites: ["project:view"] },
        delete: { labelKey: `${P}.project_management.project.delete.label`, prerequisites: ["project:view"] },
        manage: { labelKey: `${P}.project_management.project.manage.label`, prerequisites: ["project:view"] },
      },
    },
  },

  role_administration: {
    titleKey: `${P}.role_administration.title`,
    descriptionKey: `${P}.role_administration.description`,
    order: 4,
    resources: {
      custom_role: {
        view: { labelKey: `${P}.role_administration.custom_role.view.label` },
        create: { labelKey: `${P}.role_administration.custom_role.create.label`, prerequisites: ["custom_role:view"] },
        edit: { labelKey: `${P}.role_administration.custom_role.edit.label`, prerequisites: ["custom_role:view"] },
        delete: { labelKey: `${P}.role_administration.custom_role.delete.label`, prerequisites: ["custom_role:view"] },
      },
    },
  },

  workspace_pages: {
    titleKey: `${P}.workspace_pages.title`,
    descriptionKey: `${P}.workspace_pages.description`,
    order: 5,
    resources: {
      wiki: {
        view: { labelKey: `${P}.workspace_pages.wiki.view.label` },
        create: { labelKey: `${P}.workspace_pages.wiki.create.label`, prerequisites: ["wiki:view"] },
        edit: { labelKey: `${P}.workspace_pages.wiki.edit.label`, prerequisites: ["wiki:view"] },
        share: { labelKey: `${P}.workspace_pages.wiki.share.label`, prerequisites: ["wiki:view"] },
        delete: { labelKey: `${P}.workspace_pages.wiki.delete.label`, prerequisites: ["wiki:view"] },
        comment: { labelKey: `${P}.workspace_pages.wiki.comment.label`, prerequisites: ["wiki:view"] },
      },
    },
  },

  workspace_views: {
    titleKey: `${P}.workspace_views.title`,
    descriptionKey: `${P}.workspace_views.description`,
    order: 6,
    resources: {
      workspace_workitem_view: {
        view: { labelKey: `${P}.workspace_views.workspace_workitem_view.view.label` },
        create: {
          labelKey: `${P}.workspace_views.workspace_workitem_view.create.label`,
          prerequisites: ["workspace_workitem_view:view"],
        },
        edit: {
          labelKey: `${P}.workspace_views.workspace_workitem_view.edit.label`,
          prerequisites: ["workspace_workitem_view:view"],
        },
        share: {
          labelKey: `${P}.workspace_views.workspace_workitem_view.share.label`,
          prerequisites: ["workspace_workitem_view:view"],
        },
        publish: {
          labelKey: `${P}.workspace_views.workspace_workitem_view.publish.label`,
          prerequisites: ["workspace_workitem_view:view"],
        },
        export: {
          labelKey: `${P}.workspace_views.workspace_workitem_view.export.label`,
          prerequisites: ["workspace_workitem_view:view"],
        },
        delete: {
          labelKey: `${P}.workspace_views.workspace_workitem_view.delete.label`,
          prerequisites: ["workspace_workitem_view:view"],
        },
      },
    },
  },

  initiatives: {
    titleKey: `${P}.initiatives.title`,
    descriptionKey: `${P}.initiatives.description`,
    order: 7,
    resources: {
      initiative: {
        view: { labelKey: `${P}.initiatives.initiative.view.label`, foldTooltipKey: `${F}.tooltips.initiative.view` },
        create: { labelKey: `${P}.initiatives.initiative.create.label`, prerequisites: ["initiative:view"] },
        edit: {
          labelKey: `${P}.initiatives.initiative.edit.label`,
          prerequisites: ["initiative:view"],
          foldTooltipKey: `${F}.tooltips.initiative.edit`,
        },
        manage: { labelKey: `${P}.initiatives.initiative.manage.label`, prerequisites: ["initiative:view"] },
        react: {
          labelKey: `${P}.initiatives.initiative.react.label`,
          prerequisites: ["initiative:view"],
          foldedUnder: "initiative:view",
        },
        delete: { labelKey: `${P}.initiatives.initiative.delete.label`, prerequisites: ["initiative:view"] },
      },
      initiative_comment: {
        view: { labelKey: `${P}.initiatives.initiative_comment.view.label`, foldedUnder: "initiative:view" },
        create: {
          labelKey: `${P}.initiatives.initiative_comment.create.label`,
          prerequisites: ["initiative_comment:view"],
          foldedUnder: "initiative:view",
        },
        edit: {
          labelKey: `${P}.initiatives.initiative_comment.edit.label`,
          prerequisites: ["initiative_comment:view"],
        },
        react: {
          labelKey: `${P}.initiatives.initiative_comment.react.label`,
          prerequisites: ["initiative_comment:view"],
          foldedUnder: "initiative:view",
        },
        delete: {
          labelKey: `${P}.initiatives.initiative_comment.delete.label`,
          prerequisites: ["initiative_comment:view"],
        },
      },
      initiative_attachment: {
        view: { labelKey: `${P}.initiatives.initiative_attachment.view.label`, foldedUnder: "initiative:view" },
        create: {
          labelKey: `${P}.initiatives.initiative_attachment.create.label`,
          prerequisites: ["initiative_attachment:view"],
          foldedUnder: "initiative:edit",
        },
        delete: {
          labelKey: `${P}.initiatives.initiative_attachment.delete.label`,
          prerequisites: ["initiative_attachment:view"],
        },
      },
      initiative_link: {
        view: { labelKey: `${P}.initiatives.initiative_link.view.label`, foldedUnder: "initiative:view" },
        create: {
          labelKey: `${P}.initiatives.initiative_link.create.label`,
          prerequisites: ["initiative_link:view"],
          foldedUnder: "initiative:edit",
        },
        edit: {
          labelKey: `${P}.initiatives.initiative_link.edit.label`,
          prerequisites: ["initiative_link:view"],
          foldedUnder: "initiative:edit",
        },
        delete: {
          labelKey: `${P}.initiatives.initiative_link.delete.label`,
          prerequisites: ["initiative_link:view"],
          foldedUnder: "initiative:edit",
        },
      },
    },
  },

  teamspaces: {
    titleKey: `${P}.teamspaces.title`,
    descriptionKey: `${P}.teamspaces.description`,
    order: 8,
    resources: {
      teamspace: {
        browse: { labelKey: `${P}.teamspaces.teamspace.browse.label` },
        view: { labelKey: `${P}.teamspaces.teamspace.view.label` },
        create: { labelKey: `${P}.teamspaces.teamspace.create.label` },
        edit: { labelKey: `${P}.teamspaces.teamspace.edit.label`, prerequisites: ["teamspace:view"] },
        manage: { labelKey: `${P}.teamspaces.teamspace.manage.label`, prerequisites: ["teamspace:view"] },
        delete: { labelKey: `${P}.teamspaces.teamspace.delete.label`, prerequisites: ["teamspace:view"] },
      },
    },
  },

  integrations: {
    titleKey: `${P}.integrations.title`,
    descriptionKey: `${P}.integrations.description`,
    order: 9,
    resources: {
      integration: {
        view: { labelKey: `${P}.integrations.integration.view.label` },
        create: { labelKey: `${P}.integrations.integration.create.label`, prerequisites: ["integration:view"] },
        edit: { labelKey: `${P}.integrations.integration.edit.label`, prerequisites: ["integration:view"] },
        delete: { labelKey: `${P}.integrations.integration.delete.label`, prerequisites: ["integration:view"] },
        connect: { labelKey: `${P}.integrations.integration.connect.label`, prerequisites: ["integration:view"] },
        manage: { labelKey: `${P}.integrations.integration.manage.label`, prerequisites: ["integration:view"] },
      },
      webhook: {
        view: { labelKey: `${P}.integrations.webhook.view.label` },
        create: { labelKey: `${P}.integrations.webhook.create.label`, prerequisites: ["webhook:view"] },
        edit: { labelKey: `${P}.integrations.webhook.edit.label`, prerequisites: ["webhook:view"] },
        delete: { labelKey: `${P}.integrations.webhook.delete.label`, prerequisites: ["webhook:view"] },
      },
      api_token: {
        view: { labelKey: `${P}.integrations.api_token.view.label` },
        create: { labelKey: `${P}.integrations.api_token.create.label`, prerequisites: ["api_token:view"] },
        delete: { labelKey: `${P}.integrations.api_token.delete.label`, prerequisites: ["api_token:view"] },
      },
    },
  },

  analytics_and_dashboards: {
    titleKey: `${P}.analytics_and_dashboards.title`,
    descriptionKey: `${P}.analytics_and_dashboards.description`,
    order: 10,
    resources: {
      analytics: {
        view: { labelKey: `${P}.analytics_and_dashboards.analytics.view.label` },
        export: { labelKey: `${P}.analytics_and_dashboards.analytics.export.label`, prerequisites: ["analytics:view"] },
      },
      dashboard: {
        view: { labelKey: `${P}.analytics_and_dashboards.dashboard.view.label` },
        create: { labelKey: `${P}.analytics_and_dashboards.dashboard.create.label`, prerequisites: ["dashboard:view"] },
        edit: { labelKey: `${P}.analytics_and_dashboards.dashboard.edit.label`, prerequisites: ["dashboard:view"] },
        delete: { labelKey: `${P}.analytics_and_dashboards.dashboard.delete.label`, prerequisites: ["dashboard:view"] },
      },
      workspace_worklog: {
        view: { labelKey: `${P}.analytics_and_dashboards.workspace_worklog.view.label` },
        export: {
          labelKey: `${P}.analytics_and_dashboards.workspace_worklog.export.label`,
          prerequisites: ["workspace_worklog:view"],
        },
      },
      ai: {
        use: { labelKey: `${P}.analytics_and_dashboards.ai.use.label` },
      },
    },
  },

  customers: {
    titleKey: `${P}.customers.title`,
    descriptionKey: `${P}.customers.description`,
    order: 11,
    resources: {
      customer: {
        view: { labelKey: `${P}.customers.customer.view.label` },
        create: { labelKey: `${P}.customers.customer.create.label`, prerequisites: ["customer:view"] },
        edit: { labelKey: `${P}.customers.customer.edit.label`, prerequisites: ["customer:view"] },
        delete: { labelKey: `${P}.customers.customer.delete.label`, prerequisites: ["customer:view"] },
      },
      customer_attachment: {
        create: { labelKey: `${P}.customers.customer_attachment.create.label` },
        delete: { labelKey: `${P}.customers.customer_attachment.delete.label` },
      },
    },
  },

  work_item_relations: {
    titleKey: `${P}.work_item_relations.title`,
    descriptionKey: `${P}.work_item_relations.description`,
    order: 12,
    resources: {
      workitem_relation: {
        view: { labelKey: `${P}.work_item_relations.workitem_relation.view.label` },
        create: {
          labelKey: `${P}.work_item_relations.workitem_relation.create.label`,
          prerequisites: ["workitem_relation:view"],
        },
        edit: {
          labelKey: `${P}.work_item_relations.workitem_relation.edit.label`,
          prerequisites: ["workitem_relation:view"],
        },
        delete: {
          labelKey: `${P}.work_item_relations.workitem_relation.delete.label`,
          prerequisites: ["workitem_relation:view"],
        },
      },
    },
  },

  workspace_templates: {
    titleKey: `${P}.workspace_templates.title`,
    descriptionKey: `${P}.workspace_templates.description`,
    order: 13,
    resources: {
      workspace_workitem_template: {
        view: {
          labelKey: `${P}.workspace_templates.workspace_workitem_template.view.label`,
          foldedUnder: "workspace_project_template:view",
        },
        create: {
          labelKey: `${P}.workspace_templates.workspace_workitem_template.create.label`,
          prerequisites: ["workspace_workitem_template:view"],
          foldedUnder: "workspace_project_template:create",
        },
        edit: {
          labelKey: `${P}.workspace_templates.workspace_workitem_template.edit.label`,
          prerequisites: ["workspace_workitem_template:view"],
          foldedUnder: "workspace_project_template:edit",
        },
        delete: {
          labelKey: `${P}.workspace_templates.workspace_workitem_template.delete.label`,
          prerequisites: ["workspace_workitem_template:view"],
          foldedUnder: "workspace_project_template:delete",
        },
      },
      workspace_page_template: {
        view: {
          labelKey: `${P}.workspace_templates.workspace_page_template.view.label`,
          foldedUnder: "workspace_project_template:view",
        },
        create: {
          labelKey: `${P}.workspace_templates.workspace_page_template.create.label`,
          prerequisites: ["workspace_page_template:view"],
          foldedUnder: "workspace_project_template:create",
        },
        edit: {
          labelKey: `${P}.workspace_templates.workspace_page_template.edit.label`,
          prerequisites: ["workspace_page_template:view"],
          foldedUnder: "workspace_project_template:edit",
        },
        delete: {
          labelKey: `${P}.workspace_templates.workspace_page_template.delete.label`,
          prerequisites: ["workspace_page_template:view"],
          foldedUnder: "workspace_project_template:delete",
        },
      },
      workspace_project_template: {
        view: {
          labelKey: `${F}.templates.view`,
          foldTooltipKey: `${F}.tooltips.workspace_templates.view`,
        },
        create: {
          labelKey: `${F}.templates.create`,
          prerequisites: ["workspace_project_template:view"],
          foldTooltipKey: `${F}.tooltips.workspace_templates.create`,
        },
        edit: {
          labelKey: `${F}.templates.edit`,
          prerequisites: ["workspace_project_template:view"],
          foldTooltipKey: `${F}.tooltips.workspace_templates.edit`,
        },
        delete: {
          labelKey: `${F}.templates.delete`,
          prerequisites: ["workspace_project_template:view"],
          foldTooltipKey: `${F}.tooltips.workspace_templates.delete`,
        },
      },
    },
  },

  workspace_automations: {
    titleKey: `${P}.workspace_automations.title`,
    descriptionKey: `${P}.workspace_automations.description`,
    order: 14,
    resources: {
      workspace_automation: {
        view: { labelKey: `${P}.workspace_automations.workspace_automation.view.label` },
        create: {
          labelKey: `${P}.workspace_automations.workspace_automation.create.label`,
          prerequisites: ["workspace_automation:view"],
        },
        edit: {
          labelKey: `${P}.workspace_automations.workspace_automation.edit.label`,
          prerequisites: ["workspace_automation:view"],
        },
        delete: {
          labelKey: `${P}.workspace_automations.workspace_automation.delete.label`,
          prerequisites: ["workspace_automation:view"],
        },
      },
    },
  },
};

export const WORKSPACE_PERMISSION_GROUPS: PermissionMatrixGroup[] = buildPermissionGroups(
  "workspace",
  WORKSPACE_GROUPS
);
