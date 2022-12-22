import React from "react";
// next
import { useRouter } from "next/router";
import Image from "next/image";
// swr
import useSWR from "swr";
// constants
import { PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
import { addSpaceIfCamelCase, timeAgo } from "constants/common";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Spinner } from "ui";
// icons
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
// types
import { IssueResponse, IState } from "types";

const activityIcons: {
  [key: string]: JSX.Element;
} = {
  state: <Squares2X2Icon className="h-3.5 w-3.5" />,
  priority: <ChartBarIcon className="h-3.5 w-3.5" />,
  name: <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5" />,
  description: <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5" />,
  target_date: <CalendarDaysIcon className="h-3.5 w-3.5" />,
  parent: <UserIcon className="h-3.5 w-3.5" />,
};

const IssueActivitySection: React.FC = () => {
  const router = useRouter();

  const { issueId, projectId } = router.query;

  const { activeWorkspace, states, issues } = useUser();

  const { data: issueActivities } = useSWR<any[]>(
    activeWorkspace && projectId && issueId ? PROJECT_ISSUES_ACTIVITY : null,
    activeWorkspace && projectId && issueId
      ? () =>
          issuesServices.getIssueActivities(
            activeWorkspace.slug,
            projectId as string,
            issueId as string
          )
      : null
  );

  return (
    <>
      {issueActivities ? (
        <div className="space-y-3">
          {issueActivities.map((activity, index) => {
            if (activity.field !== "updated_by")
              return (
                <div key={activity.id} className="relative flex gap-x-2 w-full">
                  {issueActivities.length > 1 && index !== issueActivities.length - 1 ? (
                    <span
                      className="absolute top-5 left-2.5 h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  {activity.field ? (
                    <div className="relative z-10 flex-shrink-0 -ml-1">
                      <div
                        className={`h-7 w-7 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full`}
                      >
                        {activityIcons[activity.field as keyof typeof activityIcons]}
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex-shrink-0 border-2 border-white rounded-full h-[34px] -ml-1.5">
                      {activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                        <Image
                          src={activity.actor_detail.avatar}
                          alt={activity.actor_detail.name}
                          height={30}
                          width={30}
                          className="rounded-full"
                        />
                      ) : (
                        <div
                          className={`h-8 w-8 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full`}
                        >
                          {activity.actor_detail.first_name.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full text-xs">
                    <p>
                      <span className="font-medium">
                        {activity.actor_detail.first_name} {activity.actor_detail.last_name}
                      </span>
                      <span> {activity.verb} </span>
                      {activity.verb !== "created" ? (
                        <span>{activity.field ?? "commented"}</span>
                      ) : (
                        " this issue"
                      )}
                      <span className="ml-2 text-gray-500">{timeAgo(activity.created_at)}</span>
                    </p>
                    <div className="w-full mt-2">
                      {activity.verb !== "created" && (
                        <div>
                          <div>
                            <span className="text-gray-500">From: </span>
                            {activity.field === "state"
                              ? activity.old_value
                                ? addSpaceIfCamelCase(
                                    states?.find((s) => s.id === activity.old_value)?.name ?? ""
                                  )
                                : "None"
                              : activity.field === "parent"
                              ? activity.old_value
                                ? issues?.results.find((i) => i.id === activity.old_value)?.name
                                : "None"
                              : activity.old_value ?? "None"}
                          </div>
                          <div>
                            <span className="text-gray-500">To: </span>
                            {activity.field === "state"
                              ? activity.new_value
                                ? addSpaceIfCamelCase(
                                    states?.find((s) => s.id === activity.new_value)?.name ?? ""
                                  )
                                : "None"
                              : activity.field === "parent"
                              ? activity.new_value
                                ? issues?.results.find((i) => i.id === activity.new_value)?.name
                                : "None"
                              : activity.new_value ?? "None"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </>
  );
};

export default IssueActivitySection;
