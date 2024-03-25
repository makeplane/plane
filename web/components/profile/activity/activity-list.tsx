import { observer } from "mobx-react";
import Link from "next/link";
import { History, MessageSquare } from "lucide-react";
import { RichReadOnlyEditor } from "@plane/rich-text-editor";
import { IUserActivityResponse } from "@plane/types";
// editor
// hooks
// components
import { ActivityIcon, ActivityMessage, IssueLink } from "@/components/core";
// ui
import { ActivitySettingsLoader } from "@/components/ui";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { useUser } from "@/hooks/store";
// types

type Props = {
  activity: IUserActivityResponse | undefined;
};

export const ActivityList: React.FC<Props> = observer((props) => {
  const { activity } = props;
  // store hooks
  const { currentUser } = useUser();

  // TODO: refactor this component
  return (
    <>
      {activity ? (
        <ul role="list">
          {activity.results.map((activityItem: any) => {
            if (activityItem.field === "comment")
              return (
                <div key={activityItem.id} className="mt-2">
                  <div className="relative flex items-start space-x-3">
                    <div className="relative px-1">
                      {activityItem.field ? (
                        activityItem.new_value === "restore" && <History className="h-3.5 w-3.5 text-custom-text-200" />
                      ) : activityItem.actor_detail.avatar && activityItem.actor_detail.avatar !== "" ? (
                        <img
                          src={activityItem.actor_detail.avatar}
                          alt={activityItem.actor_detail.display_name}
                          height={30}
                          width={30}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white"
                        />
                      ) : (
                        <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-500 text-white capitalize">
                          {activityItem.actor_detail.display_name?.[0]}
                        </div>
                      )}

                      <span className="ring-6 flex h-6 w-6 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                        <MessageSquare className="h-6 w-6 !text-2xl text-custom-text-200" aria-hidden="true" />
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
                          Commented {calculateTimeAgo(activityItem.created_at)}
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

            const message =
              activityItem.verb === "created" &&
              !["cycles", "modules", "attachment", "link", "estimate"].includes(activityItem.field) &&
              !activityItem.field ? (
                <span>
                  created <IssueLink activity={activityItem} />
                </span>
              ) : (
                <ActivityMessage activity={activityItem} showIssue />
              );

            if ("field" in activityItem && activityItem.field !== "updated_by")
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
                                    <History className="h-5 w-5 text-custom-text-200" />
                                  ) : (
                                    <ActivityIcon activity={activityItem} />
                                  )
                                ) : activityItem.actor_detail.avatar && activityItem.actor_detail.avatar !== "" ? (
                                  <img
                                    src={activityItem.actor_detail.avatar}
                                    alt={activityItem.actor_detail.display_name}
                                    height={24}
                                    width={24}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white capitalize">
                                    {activityItem.actor_detail.display_name?.[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 border-b border-custom-border-100 py-4">
                          <div className="flex gap-1 break-words text-sm text-custom-text-200">
                            {activityItem.field === "archived_at" && activityItem.new_value !== "restore" ? (
                              <span className="text-gray font-medium">Plane</span>
                            ) : activityItem.actor_detail.is_bot ? (
                              <span className="text-gray font-medium">{activityItem.actor_detail.first_name} Bot</span>
                            ) : (
                              <Link
                                href={`/${activityItem.workspace_detail.slug}/profile/${activityItem.actor_detail.id}`}
                              >
                                <span className="text-gray font-medium">
                                  {currentUser?.id === activityItem.actor_detail.id
                                    ? "You"
                                    : activityItem.actor_detail.display_name}
                                </span>
                              </Link>
                            )}{" "}
                            <div className="flex gap-1 truncate">
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
