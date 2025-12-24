import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// icons
import { History, MessageSquare } from "lucide-react";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// hooks
import { ActivityIcon, ActivityMessage } from "@/components/core/activity";
import { RichTextEditor } from "@/components/editor/rich-text";
import { ActivitySettingsLoader } from "@/components/ui/loader/settings/activity";
// constants
import { USER_ACTIVITY } from "@/constants/fetch-keys";
// hooks
import { useUser } from "@/hooks/store/user";
// services
import { UserService } from "@/services/user.service";
const userService = new UserService();

type Props = {
  cursor: string;
  perPage: number;
  updateResultsCount: (count: number) => void;
  updateTotalPages: (count: number) => void;
  updateEmptyState: (state: boolean) => void;
};

export const ProfileActivityListPage = observer(function ProfileActivityListPage(props: Props) {
  const { cursor, perPage, updateResultsCount, updateTotalPages, updateEmptyState } = props;
  // store hooks
  const { data: currentUser } = useUser();

  const { data: userProfileActivity } = useSWR(
    USER_ACTIVITY({
      cursor,
    }),
    () =>
      userService.getUserActivity({
        cursor,
        per_page: perPage,
      })
  );

  useEffect(() => {
    if (!userProfileActivity) return;

    // if no results found then show empty state
    if (userProfileActivity.total_results === 0) updateEmptyState(true);

    updateTotalPages(userProfileActivity.total_pages);
    updateResultsCount(userProfileActivity.results.length);
  }, [updateResultsCount, updateTotalPages, userProfileActivity, updateEmptyState]);

  // TODO: refactor this component
  return (
    <>
      {userProfileActivity ? (
        <ul role="list">
          {userProfileActivity.results.map((activityItem: any) => {
            if (activityItem.field === "comment")
              return (
                <div key={activityItem.id} className="mt-2">
                  <div className="relative flex items-start space-x-3">
                    <div className="relative px-1">
                      {activityItem.field ? (
                        activityItem.new_value === "restore" && <History className="h-3.5 w-3.5 text-secondary" />
                      ) : activityItem.actor_detail.avatar_url && activityItem.actor_detail.avatar_url !== "" ? (
                        <img
                          src={getFileURL(activityItem.actor_detail.avatar_url)}
                          alt={activityItem.actor_detail.display_name}
                          height={30}
                          width={30}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-subtle-1 bg-layer-3"
                        />
                      ) : (
                        <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-subtle-1 bg-layer-3 capitalize">
                          {activityItem.actor_detail.display_name?.[0]}
                        </div>
                      )}

                      <span className="flex h-6 w-6 p-2 items-center justify-center rounded-full bg-layer-3 text-secondary">
                        <MessageSquare className="!text-20 text-secondary" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-11">
                          {activityItem.actor_detail.is_bot
                            ? activityItem.actor_detail.first_name + " Bot"
                            : activityItem.actor_detail.display_name}
                        </div>
                        <p className="mt-0.5 text-11 text-secondary">
                          Commented {calculateTimeAgo(activityItem.created_at)}
                        </p>
                      </div>
                      <div className="issue-comments-section p-0">
                        <RichTextEditor
                          editable={false}
                          id={activityItem.id}
                          initialValue={
                            activityItem?.new_value !== "" ? activityItem.new_value : activityItem.old_value
                          }
                          containerClassName="text-11 bg-surface-1"
                          workspaceId={activityItem?.workspace_detail?.id?.toString() ?? ""}
                          workspaceSlug={activityItem?.workspace_detail?.slug?.toString() ?? ""}
                          projectId={activityItem.project ?? ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );

            const message = <ActivityMessage activity={activityItem} showIssue />;

            if ("field" in activityItem && activityItem.field !== "updated_by")
              return (
                <li key={activityItem.id}>
                  <div className="relative pb-1">
                    <div className="relative flex items-start space-x-2">
                      <>
                        <div>
                          <div className="relative px-1.5 mt-4">
                            <div className="mt-1.5">
                              <div className="flex h-6 w-6 items-center justify-center border border-subtle rounded-lg shadow-raised-100">
                                {activityItem.field ? (
                                  activityItem.new_value === "restore" ? (
                                    <History className="h-5 w-5 text-secondary" />
                                  ) : (
                                    <ActivityIcon activity={activityItem} />
                                  )
                                ) : activityItem.actor_detail.avatar_url &&
                                  activityItem.actor_detail.avatar_url !== "" ? (
                                  <img
                                    src={getFileURL(activityItem.actor_detail.avatar_url)}
                                    alt={activityItem.actor_detail.display_name}
                                    height={24}
                                    width={24}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-6 w-6 place-items-center rounded-full border-2 border-subtle-1 bg-layer-3 text-11 capitalize">
                                    {activityItem.actor_detail.display_name?.[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 border-b border-subtle py-4">
                          <div className="break-words text-caption-md-regular text-secondary">
                            {activityItem.field === "archived_at" && activityItem.new_value !== "restore" ? (
                              <span className="text-gray font-medium">Plane</span>
                            ) : activityItem.actor_detail.is_bot ? (
                              <span className="text-gray font-medium">{activityItem.actor_detail.first_name} Bot</span>
                            ) : (
                              <Link
                                href={`/${activityItem.workspace_detail.slug}/profile/${activityItem.actor_detail.id}`}
                                className="inline"
                              >
                                <span className="text-gray font-medium">
                                  {currentUser?.id === activityItem.actor_detail.id
                                    ? "You"
                                    : activityItem.actor_detail.display_name}
                                </span>
                              </Link>
                            )}{" "}
                            <div className="inline gap-1">
                              {message}{" "}
                              <span className="flex-shrink-0 whitespace-nowrap">
                                {calculateTimeAgo(activityItem.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    </div>
                  </div>
                </li>
              );
          })}
        </ul>
      ) : (
        <ActivitySettingsLoader />
      )}
    </>
  );
});
