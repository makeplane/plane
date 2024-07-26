"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// types
import { TRecentCollaboratorsWidgetResponse } from "@plane/types";
// ui
import { Avatar } from "@plane/ui";
// hooks
import { useDashboard, useMember, useUser } from "@/hooks/store";
// components
import { WidgetLoader } from "../loaders";

type CollaboratorListItemProps = {
  issueCount: number;
  userId: string;
  workspaceSlug: string;
};

const CollaboratorListItem: React.FC<CollaboratorListItemProps> = observer((props) => {
  const { issueCount, userId, workspaceSlug } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { getUserDetails } = useMember();
  // derived values
  const userDetails = getUserDetails(userId);
  const isCurrentUser = userId === currentUser?.id;

  if (!userDetails || userDetails.is_bot) return null;

  return (
    <Link href={`/${workspaceSlug}/profile/${userId}`} className="group text-center">
      <div className="flex justify-center">
        <Avatar
          src={userDetails.avatar}
          name={userDetails.display_name}
          size={69}
          className="!text-3xl !font-medium"
          showTooltip={false}
        />
      </div>
      <h6 className="mt-6 truncate text-xs font-semibold group-hover:underline">
        {isCurrentUser ? "You" : userDetails?.display_name}
      </h6>
      <p className="mt-2 text-sm">
        {issueCount} active issue{issueCount > 1 ? "s" : ""}
      </p>
    </Link>
  );
});

type CollaboratorsListProps = {
  cursor: string;
  dashboardId: string;
  perPage: number;
  searchQuery?: string;
  updateIsLoading?: (isLoading: boolean) => void;
  updateResultsCount: (count: number) => void;
  updateTotalPages: (count: number) => void;
  workspaceSlug: string;
};

const WIDGET_KEY = "recent_collaborators";

export const CollaboratorsList: React.FC<CollaboratorsListProps> = (props) => {
  const {
    cursor,
    dashboardId,
    perPage,
    searchQuery = "",
    updateIsLoading,
    updateResultsCount,
    updateTotalPages,
    workspaceSlug,
  } = props;
  // store hooks
  const { fetchWidgetStats } = useDashboard();

  const { data: widgetStats } = useSWR(
    workspaceSlug && dashboardId && cursor
      ? `WIDGET_STATS_${workspaceSlug}_${dashboardId}_${cursor}_${searchQuery}`
      : null,
    workspaceSlug && dashboardId && cursor
      ? () =>
          fetchWidgetStats(workspaceSlug, dashboardId, {
            cursor,
            per_page: perPage,
            search: searchQuery,
            widget_key: WIDGET_KEY,
          })
      : null
  ) as {
    data: TRecentCollaboratorsWidgetResponse | undefined;
  };

  useEffect(() => {
    updateIsLoading?.(true);

    if (!widgetStats) return;

    updateIsLoading?.(false);
    updateTotalPages(widgetStats.total_pages);
    updateResultsCount(widgetStats.results?.length);
  }, [updateIsLoading, updateResultsCount, updateTotalPages, widgetStats]);

  if (!widgetStats || !widgetStats?.results) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <>
      {widgetStats?.results?.map((user) => (
        <CollaboratorListItem
          key={user.user_id}
          issueCount={user.active_issue_count}
          userId={user.user_id}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </>
  );
};
