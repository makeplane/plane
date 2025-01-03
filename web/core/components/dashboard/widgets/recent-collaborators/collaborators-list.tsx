"use client";
import { useState } from "react";
import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// types
import { TRecentCollaboratorsWidgetResponse } from "@plane/types";
// ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
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
          src={getFileURL(userDetails.avatar_url)}
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
  dashboardId: string;
  searchQuery?: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "recent_collaborators";

export const CollaboratorsList: React.FC<CollaboratorsListProps> = (props) => {
  const { dashboardId, searchQuery = "", workspaceSlug } = props;

  // state
  const [visibleItems, setVisibleItems] = useState(16);
  const [isExpanded, setIsExpanded] = useState(false);
  // store hooks
  const { fetchWidgetStats } = useDashboard();
  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  const { data: widgetStats } = useSWR(
    workspaceSlug && dashboardId ? `WIDGET_STATS_${workspaceSlug}_${dashboardId}` : null,
    workspaceSlug && dashboardId
      ? () =>
          fetchWidgetStats(workspaceSlug, dashboardId, {
            widget_key: WIDGET_KEY,
          })
      : null
  ) as {
    data: TRecentCollaboratorsWidgetResponse[] | undefined;
  };

  if (!widgetStats)
    return (
      <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
        <WidgetLoader widgetKey={WIDGET_KEY} />
      </div>
    );

  const sortedStats = sortBy(widgetStats, [(user) => user?.user_id !== currentUser?.id]);

  const filteredStats = sortedStats.filter((user) => {
    if (!user) return false;
    const userDetails = getUserDetails(user?.user_id);
    if (!userDetails || userDetails.is_bot) return false;
    const { display_name, first_name, last_name } = userDetails;
    const searchLower = searchQuery.toLowerCase();
    return (
      display_name?.toLowerCase().includes(searchLower) ||
      first_name?.toLowerCase().includes(searchLower) ||
      last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Update the displayedStats to always use the visibleItems limit
  const handleLoadMore = () => {
    setVisibleItems((prev) => {
      const newValue = prev + 16;
      if (newValue >= filteredStats.length) {
        setIsExpanded(true);
        return filteredStats.length;
      }
      return newValue;
    });
  };

  const handleHide = () => {
    setVisibleItems(16);
    setIsExpanded(false);
  };

  const displayedStats = filteredStats.slice(0, visibleItems);

  return (
    <>
      <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
        {displayedStats?.map((user) => (
          <CollaboratorListItem
            key={user?.user_id}
            issueCount={user?.active_issue_count}
            userId={user?.user_id}
            workspaceSlug={workspaceSlug}
          />
        ))}
      </div>
      {filteredStats.length > visibleItems && !isExpanded && (
        <div className="py-4 flex justify-center items-center text-sm font-medium" onClick={handleLoadMore}>
          <div className="text-custom-primary-90 hover:text-custom-primary-100 transition-all cursor-pointer">
            Load more
          </div>
        </div>
      )}
      {isExpanded && (
        <div className="py-4 flex justify-center items-center text-sm font-medium" onClick={handleHide}>
          <div className="text-custom-primary-90 hover:text-custom-primary-100 transition-all cursor-pointer">Hide</div>
        </div>
      )}
    </>
  );
};
