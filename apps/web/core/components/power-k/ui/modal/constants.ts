// plane web imports
import { POWER_K_MODAL_PAGE_DETAILS_EXTENDED } from "@/plane-web/components/command-palette/power-k/constants";
// local imports
import type { TPowerKPageType } from "../../core/types";

export type TPowerKModalPageDetails = {
  i18n_placeholder: string;
};

export const POWER_K_MODAL_PAGE_DETAILS: Record<TPowerKPageType, TPowerKModalPageDetails> = {
  "open-workspace": {
    i18n_placeholder: "power_k.page_placeholders.open_workspace",
  },
  "open-project": {
    i18n_placeholder: "power_k.page_placeholders.open_project",
  },
  "open-workspace-setting": {
    i18n_placeholder: "power_k.page_placeholders.open_workspace_setting",
  },
  "open-project-cycle": {
    i18n_placeholder: "power_k.page_placeholders.open_project_cycle",
  },
  "open-project-module": {
    i18n_placeholder: "power_k.page_placeholders.open_project_module",
  },
  "open-project-view": {
    i18n_placeholder: "power_k.page_placeholders.open_project_view",
  },
  "open-project-setting": {
    i18n_placeholder: "power_k.page_placeholders.open_project_setting",
  },
  "update-work-item-state": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_state",
  },
  "update-work-item-priority": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_priority",
  },
  "update-work-item-assignee": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_assignee",
  },
  "update-work-item-estimate": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_estimate",
  },
  "update-work-item-cycle": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_cycle",
  },
  "update-work-item-module": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_module",
  },
  "update-work-item-labels": {
    i18n_placeholder: "power_k.page_placeholders.update_work_item_labels",
  },
  "update-module-member": {
    i18n_placeholder: "power_k.page_placeholders.update_module_member",
  },
  "update-module-status": {
    i18n_placeholder: "power_k.page_placeholders.update_module_status",
  },
  "update-theme": {
    i18n_placeholder: "power_k.page_placeholders.update_theme",
  },
  "update-timezone": {
    i18n_placeholder: "power_k.page_placeholders.update_timezone",
  },
  "update-start-of-week": {
    i18n_placeholder: "power_k.page_placeholders.update_start_of_week",
  },
  "update-language": {
    i18n_placeholder: "power_k.page_placeholders.update_language",
  },
  ...POWER_K_MODAL_PAGE_DETAILS_EXTENDED,
};
