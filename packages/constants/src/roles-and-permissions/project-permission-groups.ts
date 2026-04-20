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
import type { ProjectPermissionResource } from "@plane/types";
// local imports
import type { PermissionMatrixGroup, ResourcePermissions } from "./matrix-types";
import { buildPermissionGroups } from "./permission-matrix-utils";

// ---------------------------------------------------------------------------
// Local group definition type
// ---------------------------------------------------------------------------

type ProjectGroupDef = {
  titleKey: string;
  descriptionKey: string;
  order: number;
  /**
   * Each resource key must be a valid ProjectPermissionResource.
   * Each action key must be a valid action for that resource (compile error otherwise).
   * Partial — only actions we want to surface in the UI need to be listed.
   */
  resources: { [R in ProjectPermissionResource]?: ResourcePermissions<R> };
};

// ---------------------------------------------------------------------------
// i18n key prefix
// ---------------------------------------------------------------------------

const P = "workspace_settings.settings.roles_and_permissions.psets.project" as const;
const F = "workspace_settings.settings.roles_and_permissions.psets.ui.folded_rows" as const;

// ---------------------------------------------------------------------------
// Project permission groups
//
// Render order = key insertion order within each resource's permissions object.
// To add a new group: add a new key to PROJECT_GROUPS.
// To add a new permission: add a new action key inside the resource block.
// To add a new resource to a group: add the resource key inside the group's `resources`.
// ---------------------------------------------------------------------------

const PROJECT_GROUPS: Record<string, ProjectGroupDef> = {
  project_membership: {
    titleKey: `${P}.project_membership.title`,
    descriptionKey: `${P}.project_membership.description`,
    order: 1,
    resources: {
      project_member: {
        view: { labelKey: `${P}.project_membership.project_member.view.label` },
        invite: {
          labelKey: `${P}.project_membership.project_member.invite.label`,
          prerequisites: ["project_member:view"],
        },
        edit: { labelKey: `${P}.project_membership.project_member.edit.label`, prerequisites: ["project_member:view"] },
        change_role: {
          labelKey: `${P}.project_membership.project_member.change_role.label`,
          prerequisites: ["project_member:view"],
        },
        remove: {
          labelKey: `${P}.project_membership.project_member.remove.label`,
          prerequisites: ["project_member:view"],
        },
      },
    },
  },

  work_items: {
    titleKey: `${P}.work_items.title`,
    descriptionKey: `${P}.work_items.description`,
    order: 2,
    resources: {
      workitem: {
        view: { labelKey: `${P}.work_items.workitem.view.label` },
        create: { labelKey: `${P}.work_items.workitem.create.label`, prerequisites: ["workitem:view"] },
        edit: { labelKey: `${P}.work_items.workitem.edit.label`, prerequisites: ["workitem:view"] },
        bulk_edit: { labelKey: `${P}.work_items.workitem.bulk_edit.label`, prerequisites: ["workitem:view"] },
        export: { labelKey: `${P}.work_items.workitem.export.label`, prerequisites: ["workitem:view"] },
        react: { labelKey: `${P}.work_items.workitem.react.label`, prerequisites: ["workitem:view"] },
        delete: { labelKey: `${P}.work_items.workitem.delete.label`, prerequisites: ["workitem:view"] },
      },
      comment: {
        create: { labelKey: `${P}.work_items.comment.create.label` },
        edit: { labelKey: `${P}.work_items.comment.edit.label` },
        react: { labelKey: `${P}.work_items.comment.react.label` },
        delete: { labelKey: `${P}.work_items.comment.delete.label` },
      },
      attachment: {
        view: { labelKey: `${P}.work_items.attachment.view.label` },
        create: { labelKey: `${P}.work_items.attachment.create.label`, prerequisites: ["attachment:view"] },
        delete: { labelKey: `${P}.work_items.attachment.delete.label`, prerequisites: ["attachment:view"] },
      },
      workitem_link: {
        view: { labelKey: `${P}.work_items.workitem_link.view.label` },
        create: { labelKey: `${P}.work_items.workitem_link.create.label`, prerequisites: ["workitem_link:view"] },
        edit: { labelKey: `${P}.work_items.workitem_link.edit.label`, prerequisites: ["workitem_link:view"] },
        delete: { labelKey: `${P}.work_items.workitem_link.delete.label`, prerequisites: ["workitem_link:view"] },
      },
      issue_property: {
        view: { labelKey: `${P}.work_items.issue_property.view.label` },
        edit: { labelKey: `${P}.work_items.issue_property.edit.label`, prerequisites: ["issue_property:view"] },
      },
    },
  },

  epics: {
    titleKey: `${P}.epics.title`,
    descriptionKey: `${P}.epics.description`,
    order: 3,
    resources: {
      epic: {
        view: {
          labelKey: `${P}.epics.epic.view.label`,
          foldTooltipKey: `${F}.tooltips.epics.view`,
        },
        create: { labelKey: `${P}.epics.epic.create.label`, prerequisites: ["epic:view"] },
        edit: {
          labelKey: `${P}.epics.epic.edit.label`,
          prerequisites: ["epic:view"],
          foldTooltipKey: `${F}.tooltips.epics.edit`,
        },
        react: {
          labelKey: `${P}.epics.epic.react.label`,
          prerequisites: ["epic:view"],
          foldedUnder: "epic:view",
        },
        delete: { labelKey: `${P}.epics.epic.delete.label`, prerequisites: ["epic:view"] },
      },
      epic_link: {
        view: { labelKey: `${P}.epics.epic_link.view.label`, foldedUnder: "epic:view" },
        create: {
          labelKey: `${P}.epics.epic_link.create.label`,
          prerequisites: ["epic_link:view"],
          foldedUnder: "epic:edit",
        },
        edit: {
          labelKey: `${P}.epics.epic_link.edit.label`,
          prerequisites: ["epic_link:view"],
          foldedUnder: "epic:edit",
        },
        delete: {
          labelKey: `${P}.epics.epic_link.delete.label`,
          prerequisites: ["epic_link:view"],
          foldedUnder: "epic:edit",
        },
      },
      epic_property: {
        view: { labelKey: `${P}.epics.epic_property.view.label` },
        edit: { labelKey: `${P}.epics.epic_property.edit.label`, prerequisites: ["epic_property:view"] },
      },
      epic_update: {
        view: {
          labelKey: `${P}.epics.epic_update.view.label`,
          foldTooltipKey: `${F}.tooltips.epic_updates.view`,
        },
        create: { labelKey: `${P}.epics.epic_update.create.label`, prerequisites: ["epic_update:view"] },
        edit: { labelKey: `${P}.epics.epic_update.edit.label`, prerequisites: ["epic_update:view"] },
        react: {
          labelKey: `${P}.epics.epic_update.react.label`,
          prerequisites: ["epic_update:view"],
          foldedUnder: "epic_update:view",
        },
        delete: { labelKey: `${P}.epics.epic_update.delete.label`, prerequisites: ["epic_update:view"] },
      },
      epic_update_comment: {
        view: {
          labelKey: `${P}.epics.epic_update_comment.view.label`,
          foldedUnder: "epic_update:view",
        },
        create: {
          labelKey: `${P}.epics.epic_update_comment.create.label`,
          prerequisites: ["epic_update_comment:view"],
          foldedUnder: "epic_update:view",
        },
        edit: { labelKey: `${P}.epics.epic_update_comment.edit.label`, prerequisites: ["epic_update_comment:view"] },
        react: {
          labelKey: `${P}.epics.epic_update_comment.react.label`,
          prerequisites: ["epic_update_comment:view"],
          foldedUnder: "epic_update:view",
        },
        delete: {
          labelKey: `${P}.epics.epic_update_comment.delete.label`,
          prerequisites: ["epic_update_comment:view"],
        },
      },
    },
  },

  modules_and_cycles: {
    titleKey: `${P}.modules_and_cycles.title`,
    descriptionKey: `${P}.modules_and_cycles.description`,
    order: 4,
    resources: {
      module: {
        view: { labelKey: `${P}.modules_and_cycles.module.view.label` },
        create: { labelKey: `${P}.modules_and_cycles.module.create.label`, prerequisites: ["module:view"] },
        edit: { labelKey: `${P}.modules_and_cycles.module.edit.label`, prerequisites: ["module:view"] },
        manage: { labelKey: `${P}.modules_and_cycles.module.manage.label`, prerequisites: ["module:view"] },
        archive: { labelKey: `${P}.modules_and_cycles.module.archive.label`, prerequisites: ["module:view"] },
        delete: { labelKey: `${P}.modules_and_cycles.module.delete.label`, prerequisites: ["module:view"] },
      },
      cycle: {
        view: { labelKey: `${P}.modules_and_cycles.cycle.view.label` },
        create: { labelKey: `${P}.modules_and_cycles.cycle.create.label`, prerequisites: ["cycle:view"] },
        edit: { labelKey: `${P}.modules_and_cycles.cycle.edit.label`, prerequisites: ["cycle:view"] },
        delete: { labelKey: `${P}.modules_and_cycles.cycle.delete.label`, prerequisites: ["cycle:view"] },
      },
    },
  },

  project_pages_and_views: {
    titleKey: `${P}.project_pages_and_views.title`,
    descriptionKey: `${P}.project_pages_and_views.description`,
    order: 5,
    resources: {
      page: {
        view: { labelKey: `${P}.project_pages_and_views.page.view.label` },
        create: { labelKey: `${P}.project_pages_and_views.page.create.label`, prerequisites: ["page:view"] },
        edit: { labelKey: `${P}.project_pages_and_views.page.edit.label`, prerequisites: ["page:view"] },
        share: { labelKey: `${P}.project_pages_and_views.page.share.label`, prerequisites: ["page:view"] },
        delete: { labelKey: `${P}.project_pages_and_views.page.delete.label`, prerequisites: ["page:view"] },
      },
      workitem_view: {
        view: { labelKey: `${P}.project_pages_and_views.workitem_view.view.label` },
        create: {
          labelKey: `${P}.project_pages_and_views.workitem_view.create.label`,
          prerequisites: ["workitem_view:view"],
        },
        edit: {
          labelKey: `${P}.project_pages_and_views.workitem_view.edit.label`,
          prerequisites: ["workitem_view:view"],
        },
        share: {
          labelKey: `${P}.project_pages_and_views.workitem_view.share.label`,
          prerequisites: ["workitem_view:view"],
        },
        publish: {
          labelKey: `${P}.project_pages_and_views.workitem_view.publish.label`,
          prerequisites: ["workitem_view:view"],
        },
        export: {
          labelKey: `${P}.project_pages_and_views.workitem_view.export.label`,
          prerequisites: ["workitem_view:view"],
        },
        delete: {
          labelKey: `${P}.project_pages_and_views.workitem_view.delete.label`,
          prerequisites: ["workitem_view:view"],
        },
      },
    },
  },

  intake: {
    titleKey: `${P}.intake.title`,
    descriptionKey: `${P}.intake.description`,
    order: 6,
    resources: {
      intake: {
        view: { labelKey: `${P}.intake.intake.view.label` },
        create: { labelKey: `${P}.intake.intake.create.label`, prerequisites: ["intake:view"] },
        submit: { labelKey: `${P}.intake.intake.submit.label`, prerequisites: ["intake:view"] },
        edit: { labelKey: `${P}.intake.intake.edit.label`, prerequisites: ["intake:view"] },
        react: { labelKey: `${P}.intake.intake.react.label`, prerequisites: ["intake:view"] },
        manage: { labelKey: `${P}.intake.intake.manage.label`, prerequisites: ["intake:view"] },
        configure: { labelKey: `${P}.intake.intake.configure.label`, prerequisites: ["intake:view"] },
        export: { labelKey: `${P}.intake.intake.export.label`, prerequisites: ["intake:view"] },
        delete: { labelKey: `${P}.intake.intake.delete.label`, prerequisites: ["intake:view"] },
      },
    },
  },

  project_configuration: {
    titleKey: `${P}.project_configuration.title`,
    descriptionKey: `${P}.project_configuration.description`,
    order: 7,
    resources: {
      label: {
        view: { labelKey: `${P}.project_configuration.label.view.label` },
        create: { labelKey: `${P}.project_configuration.label.create.label`, prerequisites: ["label:view"] },
        edit: { labelKey: `${P}.project_configuration.label.edit.label`, prerequisites: ["label:view"] },
        delete: { labelKey: `${P}.project_configuration.label.delete.label`, prerequisites: ["label:view"] },
      },
      state: {
        view: { labelKey: `${P}.project_configuration.state.view.label` },
        create: { labelKey: `${P}.project_configuration.state.create.label`, prerequisites: ["state:view"] },
        edit: { labelKey: `${P}.project_configuration.state.edit.label`, prerequisites: ["state:view"] },
        delete: { labelKey: `${P}.project_configuration.state.delete.label`, prerequisites: ["state:view"] },
      },
      estimate: {
        view: { labelKey: `${P}.project_configuration.estimate.view.label` },
        create: { labelKey: `${P}.project_configuration.estimate.create.label`, prerequisites: ["estimate:view"] },
        edit: { labelKey: `${P}.project_configuration.estimate.edit.label`, prerequisites: ["estimate:view"] },
        delete: { labelKey: `${P}.project_configuration.estimate.delete.label`, prerequisites: ["estimate:view"] },
      },
      milestone: {
        view: { labelKey: `${P}.project_configuration.milestone.view.label` },
        create: { labelKey: `${P}.project_configuration.milestone.create.label`, prerequisites: ["milestone:view"] },
        edit: { labelKey: `${P}.project_configuration.milestone.edit.label`, prerequisites: ["milestone:view"] },
        delete: { labelKey: `${P}.project_configuration.milestone.delete.label`, prerequisites: ["milestone:view"] },
      },
    },
  },

  automations: {
    titleKey: `${P}.automations.title`,
    descriptionKey: `${P}.automations.description`,
    order: 8,
    resources: {
      project_automation: {
        view: { labelKey: `${P}.automations.project_automation.view.label` },
        create: {
          labelKey: `${P}.automations.project_automation.create.label`,
          prerequisites: ["project_automation:view"],
        },
        edit: {
          labelKey: `${P}.automations.project_automation.edit.label`,
          prerequisites: ["project_automation:view"],
        },
        delete: {
          labelKey: `${P}.automations.project_automation.delete.label`,
          prerequisites: ["project_automation:view"],
        },
      },
      workflow: {
        view: { labelKey: `${P}.automations.workflow.view.label` },
        create: { labelKey: `${P}.automations.workflow.create.label`, prerequisites: ["workflow:view"] },
        edit: { labelKey: `${P}.automations.workflow.edit.label`, prerequisites: ["workflow:view"] },
        delete: { labelKey: `${P}.automations.workflow.delete.label`, prerequisites: ["workflow:view"] },
      },
      recurring_workitem: {
        view: { labelKey: `${P}.automations.recurring_workitem.view.label` },
        create: {
          labelKey: `${P}.automations.recurring_workitem.create.label`,
          prerequisites: ["recurring_workitem:view"],
        },
        edit: {
          labelKey: `${P}.automations.recurring_workitem.edit.label`,
          prerequisites: ["recurring_workitem:view"],
        },
        delete: {
          labelKey: `${P}.automations.recurring_workitem.delete.label`,
          prerequisites: ["recurring_workitem:view"],
        },
      },
    },
  },

  project_updates: {
    titleKey: `${P}.project_updates.title`,
    descriptionKey: `${P}.project_updates.description`,
    order: 9,
    resources: {
      project_update: {
        view: {
          labelKey: `${P}.project_updates.project_update.view.label`,
          foldTooltipKey: `${F}.tooltips.project_updates.view`,
        },
        create: {
          labelKey: `${P}.project_updates.project_update.create.label`,
          prerequisites: ["project_update:view"],
        },
        edit: { labelKey: `${P}.project_updates.project_update.edit.label`, prerequisites: ["project_update:view"] },
        react: {
          labelKey: `${P}.project_updates.project_update.react.label`,
          prerequisites: ["project_update:view"],
          foldedUnder: "project_update:view",
        },
        delete: {
          labelKey: `${P}.project_updates.project_update.delete.label`,
          prerequisites: ["project_update:view"],
        },
      },
      project_update_comment: {
        view: {
          labelKey: `${P}.project_updates.project_update_comment.view.label`,
          foldedUnder: "project_update:view",
        },
        create: {
          labelKey: `${P}.project_updates.project_update_comment.create.label`,
          prerequisites: ["project_update_comment:view"],
          foldedUnder: "project_update:view",
        },
        edit: {
          labelKey: `${P}.project_updates.project_update_comment.edit.label`,
          prerequisites: ["project_update_comment:view"],
        },
        react: {
          labelKey: `${P}.project_updates.project_update_comment.react.label`,
          prerequisites: ["project_update_comment:view"],
          foldedUnder: "project_update:view",
        },
        delete: {
          labelKey: `${P}.project_updates.project_update_comment.delete.label`,
          prerequisites: ["project_update_comment:view"],
        },
      },
    },
  },

  project_analytics: {
    titleKey: `${P}.project_analytics.title`,
    descriptionKey: `${P}.project_analytics.description`,
    order: 10,
    resources: {
      project_activity: {
        view: { labelKey: `${P}.project_analytics.project_activity.view.label` },
      },
    },
  },

  project_links: {
    titleKey: `${P}.project_links.title`,
    descriptionKey: `${P}.project_links.description`,
    order: 11,
    resources: {
      project_link: {
        view: { labelKey: `${P}.project_links.project_link.view.label` },
        create: { labelKey: `${P}.project_links.project_link.create.label`, prerequisites: ["project_link:view"] },
        edit: { labelKey: `${P}.project_links.project_link.edit.label`, prerequisites: ["project_link:view"] },
        delete: { labelKey: `${P}.project_links.project_link.delete.label`, prerequisites: ["project_link:view"] },
      },
    },
  },

  project_templates: {
    titleKey: `${P}.project_templates.title`,
    descriptionKey: `${P}.project_templates.description`,
    order: 12,
    resources: {
      project_workitem_template: {
        view: {
          labelKey: `${F}.templates.view`,
          foldTooltipKey: `${F}.tooltips.project_templates.view`,
        },
        create: {
          labelKey: `${F}.templates.create`,
          prerequisites: ["project_workitem_template:view"],
          foldTooltipKey: `${F}.tooltips.project_templates.create`,
        },
        edit: {
          labelKey: `${F}.templates.edit`,
          prerequisites: ["project_workitem_template:view"],
          foldTooltipKey: `${F}.tooltips.project_templates.edit`,
        },
        delete: {
          labelKey: `${F}.templates.delete`,
          prerequisites: ["project_workitem_template:view"],
          foldTooltipKey: `${F}.tooltips.project_templates.delete`,
        },
      },
      project_page_template: {
        view: {
          labelKey: `${P}.project_templates.project_page_template.view.label`,
          foldedUnder: "project_workitem_template:view",
        },
        create: {
          labelKey: `${P}.project_templates.project_page_template.create.label`,
          prerequisites: ["project_page_template:view"],
          foldedUnder: "project_workitem_template:create",
        },
        edit: {
          labelKey: `${P}.project_templates.project_page_template.edit.label`,
          prerequisites: ["project_page_template:view"],
          foldedUnder: "project_workitem_template:edit",
        },
        delete: {
          labelKey: `${P}.project_templates.project_page_template.delete.label`,
          prerequisites: ["project_page_template:view"],
          foldedUnder: "project_workitem_template:delete",
        },
      },
    },
  },
};

export const PROJECT_PERMISSION_GROUPS: PermissionMatrixGroup[] = buildPermissionGroups("project", PROJECT_GROUPS);
