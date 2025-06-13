// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { TPageNavigationPaneTab } from "..";

export type Props = {
  activeTab: TPageNavigationPaneTab;
  page: TPageInstance;
};

export const PageNavigationPaneAdditionalTabPanelsRoot: React.FC<Props> = () => null;
