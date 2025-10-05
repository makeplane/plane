// plane web imports
import { POWER_K_MODAL_PAGE_DETAILS_EXTENDED } from "@/plane-web/components/command-palette/power-k/constants";
// local imports
import type { TPowerKPageType } from "../../core/types";

export const POWER_K_MODAL_PAGE_DETAILS: Record<
  TPowerKPageType,
  {
    i18n_placeholder: string;
  }
> = {
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
  ...POWER_K_MODAL_PAGE_DETAILS_EXTENDED,
};
