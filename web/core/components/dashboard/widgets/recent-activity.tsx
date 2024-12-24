"use client";

import { useEffect, useRef } from "react";
import { IssueIdentifier } from "ee/components/issues";
import { observer } from "mobx-react";
import Link from "next/link";
import { History } from "lucide-react";
// types
import { TRecentActivityWidgetResponse } from "@plane/types";
// components
import { getButtonStyling, PriorityIcon } from "@plane/ui";
import { ListItem } from "@/components/core/list";
import { WidgetLoader, WidgetProps } from "@/components/dashboard/widgets";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useDashboard, useUser } from "@/hooks/store";

const WIDGET_KEY = "recent_activity";

type BlockProps = {
  activity: TRecentActivityWidgetResponse;
  ref: React.RefObject<HTMLDivElement>;
};
const Block = (props: BlockProps) => {
  const { activity, ref } = props;
  console.log({ ...activity.issue_detail });
  return (
    <ListItem
      key={activity.id}
      itemLink=""
      title={""}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center justify-center rounded-md gap-4 ">
          <IssueIdentifier
            issueTypeId={activity.issue_detail?.type_id}
            projectId={activity?.project || ""}
            projectIdentifier={activity.project_detail?.identifier || ""}
            issueSequenceId={activity.issue_detail?.sequence_id || ""}
            textContainerClassName="text-custom-sidebar-text-400 text-sm whitespace-nowrap"
          />
          <div className="text-custom-text-200 font-medium text-sm whitespace-nowrap">
            {activity.issue_detail?.name}
          </div>
        </div>
      }
      quickActionElement={
        <div>
          <PriorityIcon priority={activity.issue_detail?.priority} withContainer size={12} />
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="bg-transparent my-auto !px-2 border-custom-border-200/40 py-3"
    />
  );
};

export const RecentActivityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  const ref = useRef<HTMLDivElement>(null);
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<TRecentActivityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);
  const redirectionLink = `/${workspaceSlug}/profile/${currentUser?.id}/activity`;

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between">
        <Link href={redirectionLink} className="text-base font-semibold text-custom-text-350 hover:underline">
          Recent issues{" "}
        </Link>
        <Link
          href={redirectionLink}
          className="text-sm font-medium text-custom-primary-100 group-hover:text-custom-text-100 group-hover:underline"
        >
          View all
        </Link>
      </div>
      {widgetStats.length > 0 && (
        <div className="mt-2">
          {widgetStats.map((activity) => (
            <Block key={activity.id} activity={activity} ref={ref} />
          ))}
        </div>
      )}
    </div>
  );
});
