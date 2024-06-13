import { observer } from "mobx-react";
import { Globe2, Lock } from "lucide-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// ui
import { ArchiveIcon } from "@plane/ui";
// plane web components
import { PagesAppDashboardListItem } from "@/plane-web/components/pages";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
};

export const PagesAppDashboardList: React.FC<Props> = observer((props) => {
  const { pageType } = props;
  // store hooks
  const { currentWorkspacePublicPageIds, currentWorkspacePrivatePageIds, currentWorkspaceArchivePageIds } =
    useWorkspacePages();

  const tabsInfo: {
    [key in TPageNavigationTabs]: {
      label: string;
      icon: any;
      pageIds: string[] | undefined;
    };
  } = {
    public: {
      label: "Public pages",
      icon: Globe2,
      pageIds: currentWorkspacePublicPageIds,
    },
    private: {
      label: "Private pages",
      icon: Lock,
      pageIds: currentWorkspacePrivatePageIds,
    },
    archived: {
      label: "Archived pages",
      icon: ArchiveIcon,
      pageIds: currentWorkspaceArchivePageIds,
    },
  };

  const selectedTab = tabsInfo[pageType];

  return (
    <div className="space-y-2 bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 p-6">
      <h6 className="text-lg font-semibold text-custom-text-300">{selectedTab.label}</h6>
      <div className="max-h-96 overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {selectedTab.pageIds?.map((pageId) => <PagesAppDashboardListItem key={pageId} pageId={pageId} />)}
      </div>
    </div>
  );
});
