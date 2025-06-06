import { Tab } from "@headlessui/react";
// plane web imports
import { PAGE_NAVIGATION_PANE_TABS_LIST } from "@/plane-web/components/pages/editor/navigation-pane";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabPanel } from "./info";
import { PageNavigationPaneOutlineTabPanel } from "./outline";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneTabPanelsRoot: React.FC<Props> = (props) => {
  const { page } = props;

  return (
    <Tab.Panels>
      {PAGE_NAVIGATION_PANE_TABS_LIST.map((tab) => (
        <Tab.Panel key={tab.key}>
          {tab.key === "outline" && <PageNavigationPaneOutlineTabPanel page={page} />}
          {tab.key === "info" && <PageNavigationPaneInfoTabPanel page={page} />}
        </Tab.Panel>
      ))}
    </Tab.Panels>
  );
};
