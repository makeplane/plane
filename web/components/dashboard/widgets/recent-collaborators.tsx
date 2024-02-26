import { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useDashboard, useMember, useUser } from "hooks/store";
// components
import { RecentCollaboratorsEmptyState, WidgetLoader, WidgetProps } from "components/dashboard/widgets";
// ui
import { Avatar } from "@plane/ui";
// types
import { TRecentCollaboratorsWidgetResponse } from "@plane/types";

type CollaboratorListItemProps = {
  issueCount: number;
  userId: string;
  workspaceSlug: string;
};

const WIDGET_KEY = "recent_collaborators";

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

export const RecentCollaboratorsWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  const widgetStats = getWidgetStats<TRecentCollaboratorsWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300">
      <div className="px-7 pt-6">
        <h4 className="text-lg font-semibold text-custom-text-300">Most active members</h4>
        <p className="mt-2 text-xs font-medium text-custom-text-300">
          Top eight active members in your project by last activity
        </p>
      </div>
      {widgetStats.length > 1 ? (
        <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
          {widgetStats.map((user) => (
            <CollaboratorListItem
              key={user.user_id}
              issueCount={user.active_issue_count}
              userId={user.user_id}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <RecentCollaboratorsEmptyState />
        </div>
      )}
    </div>
  );
});
