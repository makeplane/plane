import React from "react";
import { Tab } from "@headlessui/react";
// components
import { TPageRootHandlers } from "@/components/pages/editor";
// plane web imports
import { PAGE_NAVIGATION_PANE_TABS_LIST } from "@/plane-web/components/pages/editor/navigation-pane";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneAssetsTabPanel } from "./assets";
import { PageNavigationPaneInfoTabPanel } from "./info/root";
import { PageNavigationPaneOutlineTabPanel } from "./outline";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneTabPanelsRoot: React.FC<Props> = (props) => {
  const { page, versionHistory } = props;

  return (
    <Tab.Panels as={React.Fragment}>
      {PAGE_NAVIGATION_PANE_TABS_LIST.map((tab) => (
        <Tab.Panel
          key={tab.key}
          as="div"
          className="size-full p-3.5 pt-0 overflow-y-auto vertical-scrollbar scrollbar-sm outline-none"
        >
          {tab.key === "outline" && <PageNavigationPaneOutlineTabPanel page={page} />}
          {tab.key === "info" && <PageNavigationPaneInfoTabPanel page={page} versionHistory={versionHistory} />}
          {tab.key === "assets" && <PageNavigationPaneAssetsTabPanel page={page} />}
        </Tab.Panel>
      ))}
    </Tab.Panels>
  );
};
