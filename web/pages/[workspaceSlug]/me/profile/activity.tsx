import useSWR from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
// services
import { UserService } from "services/user.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import { ActivityIcon, ActivityMessage } from "components/core";
import { RichReadOnlyEditor } from "@plane/rich-text-editor";
// icons
import { ArrowTopRightOnSquareIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
// ui
import { Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { Loader } from "@plane/ui";
// fetch-keys
import { USER_ACTIVITY } from "constants/fetch-keys";
// helper
import { timeAgo } from "helpers/date-time.helper";
import { SettingsSidebar } from "components/project";

const userService = new UserService();

const ProfileActivity = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: userActivity } = useSWR(
    workspaceSlug ? USER_ACTIVITY : null,
    workspaceSlug ? () => userService.getUserWorkspaceActivity(workspaceSlug.toString()) : null
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Activity" />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>

        {userActivity ? (
          <section className="pr-9 py-8 w-full overflow-y-auto">
            <div className="flex items-center py-3.5 border-b border-custom-border-200">
              <h3 className="text-xl font-medium">Activity</h3>
            </div>
            <div className={`flex flex-col gap-2 py-4 w-full`}>
              <ul role="list" className="-mb-4">
                {userActivity.results.map((activityItem: any) => {
                  if (activityItem.field === "comment") {
                    return (
                      <div key={activityItem.id} className="mt-2">
                        <div className="relative flex items-start space-x-3">
                          <div className="relative px-1">
                            {activityItem.field ? (
                              activityItem.new_value === "restore" && (
                                <Icon iconName="history" className="text-sm text-custom-text-200" />
                              )
                            ) : activityItem.actor_detail.avatar && activityItem.actor_detail.avatar !== "" ? (
                              <img
                                src={activityItem.actor_detail.avatar}
                                alt={activityItem.actor_detail.display_name}
                                height={30}
                                width={30}
                                className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white"
                              />
                            ) : (
                              <div
                                className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white`}
                              >
                                {activityItem.actor_detail.display_name?.charAt(0)}
                              </div>
                            )}

                            <span className="ring-6 flex h-6 w-6 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                              <ChatBubbleLeftEllipsisIcon
                                className="h-6 w-6 !text-2xl text-custom-text-200"
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-xs">
                                {activityItem.actor_detail.is_bot
                                  ? activityItem.actor_detail.first_name + " Bot"
                                  : activityItem.actor_detail.display_name}
                              </div>
                              <p className="mt-0.5 text-xs text-custom-text-200">
                                Commented {timeAgo(activityItem.created_at)}
                              </p>
                            </div>
                            <div className="issue-comments-section p-0">
                              <RichReadOnlyEditor
                                value={activityItem?.new_value !== "" ? activityItem.new_value : activityItem.old_value}
                                customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
                                noBorder
                                borderOnFocus={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const message =
                    activityItem.verb === "created" &&
                    activityItem.field !== "cycles" &&
                    activityItem.field !== "modules" &&
                    activityItem.field !== "attachment" &&
                    activityItem.field !== "link" &&
                    activityItem.field !== "estimate" ? (
                      <span className="text-custom-text-200">
                        created{" "}
                        <Link href={`/${workspaceSlug}/projects/${activityItem.project}/issues/${activityItem.issue}`}>
                          <a className="inline-flex items-center hover:underline">
                            this issue. <ArrowTopRightOnSquareIcon className="ml-1 h-3.5 w-3.5" />
                          </a>
                        </Link>
                      </span>
                    ) : activityItem.field ? (
                      <ActivityMessage activity={activityItem} showIssue />
                    ) : (
                      "created the issue."
                    );

                  if ("field" in activityItem && activityItem.field !== "updated_by") {
                    return (
                      <li key={activityItem.id}>
                        <div className="relative pb-1">
                          <div className="relative flex items-center space-x-2">
                            <>
                              <div>
                                <div className="relative px-1.5">
                                  <div className="mt-1.5">
                                    <div className="flex h-6 w-6 items-center justify-center">
                                      {activityItem.field ? (
                                        activityItem.new_value === "restore" ? (
                                          <Icon iconName="history" className="!text-2xl text-custom-text-200" />
                                        ) : (
                                          <ActivityIcon activity={activityItem} />
                                        )
                                      ) : activityItem.actor_detail.avatar &&
                                        activityItem.actor_detail.avatar !== "" ? (
                                        <img
                                          src={activityItem.actor_detail.avatar}
                                          alt={activityItem.actor_detail.display_name}
                                          height={24}
                                          width={24}
                                          className="rounded-full"
                                        />
                                      ) : (
                                        <div
                                          className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white`}
                                        >
                                          {activityItem.actor_detail.display_name?.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="min-w-0 flex-1 py-4 border-b border-custom-border-200">
                                <div className="text-sm text-custom-text-200 break-words">
                                  {activityItem.field === "archived_at" && activityItem.new_value !== "restore" ? (
                                    <span className="text-gray font-medium">Plane</span>
                                  ) : activityItem.actor_detail.is_bot ? (
                                    <span className="text-gray font-medium">
                                      {activityItem.actor_detail.first_name} Bot
                                    </span>
                                  ) : (
                                    <Link href={`/${workspaceSlug}/profile/${activityItem.actor_detail.id}`}>
                                      <a className="text-gray font-medium">{activityItem.actor_detail.display_name}</a>
                                    </Link>
                                  )}{" "}
                                  {message}{" "}
                                  <span className="whitespace-nowrap">{timeAgo(activityItem.created_at)}</span>
                                </div>
                              </div>
                            </>
                          </div>
                        </div>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          </section>
        ) : (
          <Loader className="space-y-5">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfileActivity;
