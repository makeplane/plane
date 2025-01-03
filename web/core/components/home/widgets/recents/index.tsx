"use client";

import { useRef, useState } from "react";
import { observer } from "mobx-react";
// types
import { TActivityEntityData, THomeWidgetProps, TRecentActivityFilterKeys } from "@plane/types";
// components
import { FiltersDropdown } from "./filters";
import { RecentIssue } from "./issue";
import { WorkspaceService } from "@/plane-web/services";
import useSWR from "swr";
import { RecentProject } from "./project";
import { RecentPage } from "./page";
import { EWidgetKeys, WidgetLoader } from "../loaders";
import { Briefcase, FileText } from "lucide-react";
import { LayersIcon } from "@plane/ui";
import { EmptyWorkspace } from "../empty-states";

const WIDGET_KEY = EWidgetKeys.RECENT_ACTIVITY;
const workspaceService = new WorkspaceService();
const filters: { name: TRecentActivityFilterKeys; icon?: React.ReactNode }[] = [
  { name: "all item" },
  { name: "issue", icon: <LayersIcon className="w-4 h-4" /> },
  { name: "page", icon: <FileText size={16} /> },
  { name: "project", icon: <Briefcase size={16} /> },
];

export const RecentActivityWidget: React.FC<THomeWidgetProps> = observer((props) => {
  const { workspaceSlug } = props;
  // state
  const [filter, setFilter] = useState<TRecentActivityFilterKeys>(filters[0].name);
  // ref
  const ref = useRef<HTMLDivElement>(null);

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
        return <RecentPage activity={activity} ref={ref} workspaceSlug={workspaceSlug} />;
      case "project":
        return <RecentProject activity={activity} ref={ref} workspaceSlug={workspaceSlug} />;
      case "issue":
        return <RecentIssue activity={activity} ref={ref} workspaceSlug={workspaceSlug} />;
      default:
        return <></>;
    }
  };

  if (!isLoading && recents?.length === 0) return <EmptyWorkspace />;

  return (
    <div ref={ref} className=" max-h-[500px] overflow-y-scroll">
      <div className="flex items-center justify-between mb-2">
        <div className="text-base font-semibold text-custom-text-350 hover:underline">Recents</div>

        <FiltersDropdown filters={filters} activeFilter={filter} setActiveFilter={setFilter} />
      </div>
      {isLoading && <WidgetLoader widgetKey={WIDGET_KEY} />}
      {!isLoading &&
        recents?.length > 0 &&
        recents.map((activity: TActivityEntityData) => <div key={activity.id}>{resolveRecent(activity)}</div>)}
    </div>
  );
});
