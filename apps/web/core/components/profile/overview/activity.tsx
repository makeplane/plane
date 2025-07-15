"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { useTranslation } from "@plane/i18n";
import { Loader, Card } from "@plane/ui";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// components
import { ActivityMessage, IssueLink } from "@/components/core";
import { ProfileEmptyState } from "@/components/ui";
// constants
import { USER_PROFILE_ACTIVITY } from "@/constants/fetch-keys";
// helpers
// hooks
import { useUser } from "@/hooks/store";
// assets
import recentActivityEmptyState from "@/public/empty-state/recent_activity.svg";
// services
import { UserService } from "@/services/user.service";

const userService = new UserService();

export const ProfileActivity = observer(() => {
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
      <h3 className="text-lg font-medium">{t("profile.stats.recent_activity.title")}</h3>
      <Card>
        {userProfileActivity ? (
          userProfileActivity.results.length > 0 ? (
            <div className="space-y-5">
              {userProfileActivity.results.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 grid place-items-center overflow-hidden rounded h-6 w-6">
                    {activity.actor_detail?.avatar_url && activity.actor_detail?.avatar_url !== "" ? (
                      <img
                        src={getFileURL(activity.actor_detail?.avatar_url)}
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
                    <p className="text-xs text-custom-text-200 whitespace-nowrap ">
                      {calculateTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              title={t("no_data_yet")}
              description={t("profile.stats.recent_activity.empty")}
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
      </Card>
    </div>
  );
});
