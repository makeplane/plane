// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { TPageNavigationPaneTab } from "..";

export type TPageNavigationPaneAdditionalTabPanelsRootProps = {
  activeTab: TPageNavigationPaneTab;
  page: TPageInstance;
};

export function PageNavigationPaneAdditionalTabPanelsRoot(_props: TPageNavigationPaneAdditionalTabPanelsRootProps) {
  return null;
}
