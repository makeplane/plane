import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import { ActivityMessage, IssueLink } from "@/components/core";
import { ProfileEmptyState } from "@/components/ui";
// constants
import { USER_PROFILE_ACTIVITY } from "@/constants/fetch-keys";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
//hooks
// services
import { useUser } from "@/hooks/store";
import { UserService } from "@/services/user.service";
// assets
import recentActivityEmptyState from "public/empty-state/recent_activity.svg";

const userService = new UserService();

export const ProfileActivity = observer(() => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;
  // store hooks
  const { data: currentUser } = useUser();

  const { data: userProfileActivity } = useSWR(
    workspaceSlug && userId ? USER_PROFILE_ACTIVITY(workspaceSlug.toString(), userId.toString(), {}) : null,
    workspaceSlug && userId
      ? () =>
          userService.getUserProfileActivity(workspaceSlug.toString(), userId.toString(), {
            per_page: 10,
          })
      : null
  );

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Recent activity</h3>
      <div className="rounded border border-custom-border-100 p-6">
        {userProfileActivity ? (
          userProfileActivity.results.length > 0 ? (
            <div className="space-y-5">
              {userProfileActivity.results.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 grid place-items-center overflow-hidden rounded h-6 w-6">
                    {activity.actor_detail?.avatar && activity.actor_detail?.avatar !== "" ? (
                      <img
                        src={activity.actor_detail?.avatar}
                        alt={activity.actor_detail?.display_name}
                        className="rounded"
                      />
                    ) : (
                      <div className="grid h-6 w-6 place-items-center rounded border-2 bg-gray-700 text-xs text-white">
                        {activity.actor_detail?.display_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="-mt-1 w-4/5 break-words">
                    <p className="inline text-sm text-custom-text-200">
                      <span className="font-medium text-custom-text-100">
                        {currentUser?.id === activity.actor_detail?.id ? "You" : activity.actor_detail?.display_name}{" "}
                      </span>
                      {activity.field ? (
                        <ActivityMessage activity={activity} showIssue />
                      ) : (
                        <span>
                          created <IssueLink activity={activity} />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-custom-text-200 whitespace-nowrap ">
                      {calculateTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              title="No Data yet"
              description="We couldn’t find data. Kindly view your inputs"
              image={recentActivityEmptyState}
            />
          )
        ) : (
          <Loader className="space-y-5">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </div>
    </div>
  );
});
