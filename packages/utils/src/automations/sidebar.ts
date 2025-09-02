import { EAutomationSidebarTab } from "@plane/types";

/**
 * Get the title for the sidebar header based on the selected tab
 * @param tab - The selected tab
 * @returns The title for the sidebar header
 */
export const getSidebarHeaderI18nTitle = (tab: EAutomationSidebarTab) => {
  switch (tab) {
    case EAutomationSidebarTab.ACTION:
      return "automations.action.sidebar_header";
    case EAutomationSidebarTab.TRIGGER:
      return "automations.trigger.sidebar_header";
    case EAutomationSidebarTab.ACTIVITY:
      return "common.activity";
  }
};
