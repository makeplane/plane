"use client";

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { Briefcase, FileText } from "lucide-react";
// plane types
import { TActivityEntityData, THomeWidgetProps, TRecentActivityFilterKeys } from "@plane/types";
// plane ui
import { LayersIcon } from "@plane/ui";
// components
import { ContentOverflowWrapper } from "@/components/core/content-overflow-HOC";
// hooks
import { useProject } from "@/hooks/store";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
import { NoProjectsEmptyState, RecentsEmptyState } from "../empty-states";
import { EWidgetKeys, WidgetLoader } from "../loaders";
import { FiltersDropdown } from "./filters";
import { RecentIssue } from "./issue";
import { RecentPage } from "./page";
import { RecentProject } from "./project";

const WIDGET_KEY = EWidgetKeys.RECENT_ACTIVITY;
const workspaceService = new WorkspaceService();
const filters: { name: TRecentActivityFilterKeys; icon?: React.ReactNode }[] = [
  { name: "all item" },
  { name: "issue", icon: <LayersIcon className="flex-shrink-0 size-4" /> },
  { name: "page", icon: <FileText className="flex-shrink-0 size-4" /> },
  { name: "project", icon: <Briefcase className="flex-shrink-0 size-4" /> },
];

type TRecentWidgetProps = THomeWidgetProps & {
  presetFilter?: TRecentActivityFilterKeys;
  showFilterSelect?: boolean;
};

export const RecentActivityWidget: React.FC<TRecentWidgetProps> = observer((props) => {
  const { presetFilter, showFilterSelect = true, workspaceSlug } = props;
  // states
  const [filter, setFilter] = useState<TRecentActivityFilterKeys>(presetFilter ?? filters[0].name);
  // navigation
  const pathname = usePathname();
  // ref
  const ref = useRef<HTMLDivElement>(null);
  // store hooks
  const { joinedProjectIds, loader } = useProject();
  // derived values
  const isWikiApp = pathname.includes(`/${workspaceSlug.toString()}/pages`);

  const { data: recents, isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_RECENT_ACTIVITY_${workspaceSlug}_${filter}` : null,
    workspaceSlug
      ? () =>
          workspaceService.fetchWorkspaceRecents(
            workspaceSlug.toString(),
            filter === filters[0].name ? undefined : filter
          )
      : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const resolveRecent = (activity: TActivityEntityData) => {
    switch (activity.entity_name) {
      case "page":
      case "workspace_page":
        return <RecentPage activity={activity} ref={ref} workspaceSlug={workspaceSlug} />;
      case "project":
        return <RecentProject activity={activity} ref={ref} workspaceSlug={workspaceSlug} />;
      case "issue":
        return <RecentIssue activity={activity} ref={ref} workspaceSlug={workspaceSlug} />;
      default:
        return <></>;
    }
  };

  if (!loader && !isWikiApp && joinedProjectIds?.length === 0) return <NoProjectsEmptyState />;

  if (!isLoading && recents?.length === 0)
    return (
      <div ref={ref} className="max-h-[500px] overflow-y-scroll">
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-semibold text-custom-text-350">Recents</div>
          {showFilterSelect && <FiltersDropdown filters={filters} activeFilter={filter} setActiveFilter={setFilter} />}
        </div>
        <div className="flex flex-col items-center justify-center">
          <RecentsEmptyState type={filter} />
        </div>
      </div>
    );

  return (
    <ContentOverflowWrapper
      maxHeight={415}
      containerClassName="box-border min-h-[250px]"
      fallback={<></>}
      buttonClassName="bg-custom-background-90/20"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-base font-semibold text-custom-text-350">Recents</div>
        {showFilterSelect && <FiltersDropdown filters={filters} activeFilter={filter} setActiveFilter={setFilter} />}
      </div>
      <div className="min-h-[250px] flex flex-col">
        {isLoading && <WidgetLoader widgetKey={WIDGET_KEY} />}
        {!isLoading &&
          recents
            ?.filter((recent) => recent.entity_data)
            .map((activity) => <div key={activity.id}>{resolveRecent(activity)}</div>)}
      </div>
    </ContentOverflowWrapper>
  );
});
