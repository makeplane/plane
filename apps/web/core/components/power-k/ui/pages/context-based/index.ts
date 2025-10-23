export * from "./root";

// components
import type { TPowerKContextType } from "@/components/power-k/core/types";
// plane web imports
import { CONTEXT_ENTITY_MAP_EXTENDED } from "@/plane-web/components/command-palette/power-k/pages/context-based";

export type TContextEntityMap = {
  i18n_title: string;
  i18n_indicator: string;
};

export const CONTEXT_ENTITY_MAP: Record<TPowerKContextType, TContextEntityMap> = {
  "work-item": {
    i18n_title: "power_k.contextual_actions.work_item.title",
    i18n_indicator: "power_k.contextual_actions.work_item.indicator",
  },
  page: {
    i18n_title: "power_k.contextual_actions.page.title",
    i18n_indicator: "power_k.contextual_actions.page.indicator",
  },
  cycle: {
    i18n_title: "power_k.contextual_actions.cycle.title",
    i18n_indicator: "power_k.contextual_actions.cycle.indicator",
  },
  module: {
    i18n_title: "power_k.contextual_actions.module.title",
    i18n_indicator: "power_k.contextual_actions.module.indicator",
  },
  ...CONTEXT_ENTITY_MAP_EXTENDED,
};
