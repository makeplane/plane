import { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react";
import useSWR from "swr";
// store hooks
import { useDashboard, useMember, useUser } from "hooks/store";
// components
import { WidgetLoader } from "./loaders";
// ui
import { Avatar } from "@plane/ui";
// types
import { TRecentCollaboratorsWidgetResponse } from "@plane/types";

type CollaboratorListItemProps = {
  issueCount: number;
  userId: string;
  workspaceSlug: string;
};

const CollaboratorListItem: React.FC<CollaboratorListItemProps> = observer((props) => {
  const { issueCount, userId, workspaceSlug } = props;
  // store hooks
  const { currentUser } = useUser();
  const { getUserDetails } = useMember();
  // derived values
  const userDetails = getUserDetails(userId);
  const isCurrentUser = userId === currentUser?.id;

  if (!userDetails) return null;

  return (
    <Link href={`/${workspaceSlug}/profile/${userId}`} className="group text-center">
      <div className="flex justify-center">
        <Avatar
          src={userDetails.avatar}
          name={isCurrentUser ? "You" : userDetails.display_name}
          size={69}
          className="!text-3xl !font-medium"
          showTooltip={false}
        />
      </div>
      <h6 className="mt-6 text-xs font-semibold group-hover:underline truncate">
        {isCurrentUser ? "You" : userDetails?.display_name}
      </h6>
      <p className="text-sm mt-2">
        {issueCount} active issue{issueCount > 1 ? "s" : ""}
      </p>
    </Link>
  );
});

type CollaboratorsListProps = {
  cursor: string;
  dashboardId: string;
  perPage: number;
  updateResultsCount: (count: number) => void;
  updateTotalPages: (count: number) => void;
  workspaceSlug: string;
};

const WIDGET_KEY = "recent_collaborators";

export const CollaboratorsList: React.FC<CollaboratorsListProps> = (props) => {
  const { cursor, dashboardId, perPage, updateResultsCount, updateTotalPages, workspaceSlug } = props;
  // store hooks
  const { fetchWidgetStats } = useDashboard();

  const { data: widgetStats } = useSWR(
    workspaceSlug && dashboardId && cursor ? `WIDGET_STATS_${workspaceSlug.toString()}_${dashboardId}_${cursor}` : null,
    workspaceSlug && dashboardId && cursor
      ? () =>
          fetchWidgetStats(workspaceSlug.toString(), dashboardId, {
            cursor,
            per_page: perPage,
            widget_key: WIDGET_KEY,
          })
      : null
  ) as {
    data: TRecentCollaboratorsWidgetResponse | undefined;
  };

  useEffect(() => {
    if (!widgetStats) return;

    updateTotalPages(widgetStats.total_pages);
    updateResultsCount(widgetStats.results.length);
  }, [updateResultsCount, updateTotalPages, widgetStats]);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
      {widgetStats?.results.map((user) => (
        <CollaboratorListItem
          key={user.user_id}
          issueCount={user.active_issue_count}
          userId={user.user_id}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </div>
  );
};
