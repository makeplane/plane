import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader, Card } from "@plane/ui";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// components
import { ActivityMessage, IssueLink } from "@/components/core/activity";
// constants
import { USER_PROFILE_ACTIVITY } from "@/constants/fetch-keys";
// helpers
// hooks
import { useUser } from "@/hooks/store/user";
// services
import { UserService } from "@/services/user.service";

const userService = new UserService();

export const ProfileActivity = observer(function ProfileActivity() {
  const { workspaceSlug, userId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { t } = useTranslation();

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
      <h3 className="text-16 font-medium">{t("profile.stats.recent_activity.title")}</h3>
      <Card>
        {userProfileActivity ? (
          userProfileActivity.results.length > 0 ? (
            <div className="space-y-5">
              {userProfileActivity.results.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 grid place-items-center overflow-hidden rounded-sm h-6 w-6">
                    {activity.actor_detail?.avatar_url && activity.actor_detail?.avatar_url !== "" ? (
                      <img
                        src={getFileURL(activity.actor_detail?.avatar_url)}
                        alt={activity.actor_detail?.display_name}
                        className="rounded-sm"
                      />
                    ) : (
                      <div className="grid h-6 w-6 place-items-center rounded-sm border-2 border-strong text-11 text-on-color">
                        {activity.actor_detail?.display_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="-mt-1 w-4/5 break-words">
                    <p className="inline text-13 text-secondary">
                      <span className="font-medium text-primary">
                        {currentUser?.id === activity.actor_detail?.id
                          ? "You"
                          : activity.actor_detail?.display_name}{" "}
                      </span>
                      {activity.field ? (
                        <ActivityMessage activity={activity} showIssue />
                      ) : (
                        <span>
                          created <IssueLink activity={activity} />
                        </span>
                      )}
                    </p>
                    <p className="text-11 text-secondary whitespace-nowrap ">{calculateTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCompact title={t("no_data_yet")} assetKey="unknown" assetClassName="size-20" />
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
      </Card>
    </div>
  );
});
