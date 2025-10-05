export * from "./root";

// components
import type { TPowerKContextType } from "@/components/power-k/core/types";
// plane web imports
import { CONTEXT_BASED_ACTIONS_MAP_EXTENDED } from "@/plane-web/components/command-palette/power-k/context-based-actions";

export const CONTEXT_BASED_ACTIONS_MAP: Record<
  TPowerKContextType,
  {
    i18n_title: string;
  }
> = {
  "work-item": {
    i18n_title: "power_k.contextual_actions.work_item.title",
  },
  page: {
    i18n_title: "power_k.contextual_actions.page.title",
  },
  cycle: {
    i18n_title: "power_k.contextual_actions.cycle.title",
  },
  module: {
    i18n_title: "power_k.contextual_actions.module.title",
  },
  ...CONTEXT_BASED_ACTIONS_MAP_EXTENDED,
};
