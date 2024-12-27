import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getCurrentWorkspacePageIdsByType } = useWorkspacePages();

  const tabsInfo: {
    [key in TPageNavigationTabs]: {
      label: string;
      icon: any;
    };
  } = {
    public: {
      label: "Public pages",
      icon: Globe2,
    },
    private: {
      label: "Private pages",
      icon: Lock,
    },
    archived: {
      label: "Archived pages",
      icon: ArchiveIcon,
    },
  };

  const selectedTab = tabsInfo[pageType];
  const pageIds = getCurrentWorkspacePageIdsByType(pageType);

  return (
    <div className="space-y-2 bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 p-6">
      <Link
        href={`/${workspaceSlug.toString()}/pages/${pageType}`}
        className="text-lg font-semibold text-custom-text-300 hover:underline"
      >
        {selectedTab.label}
      </Link>
      <div className="max-h-96 overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {pageIds?.map((pageId) => <PagesAppDashboardListItem key={pageId} pageId={pageId} />)}
      </div>
    </div>
  );
});
