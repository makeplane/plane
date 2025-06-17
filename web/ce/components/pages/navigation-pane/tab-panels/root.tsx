// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { TPageNavigationPaneTab } from "..";

export type TPageNavigationPaneAdditionalTabPanelsRootProps = {
  activeTab: TPageNavigationPaneTab;
  page: TPageInstance;
};

export const PageNavigationPaneAdditionalTabPanelsRoot: React.FC<
  TPageNavigationPaneAdditionalTabPanelsRootProps
> = () => null;
