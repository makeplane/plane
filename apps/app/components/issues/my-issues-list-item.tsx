import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// components
import { AssigneesList } from "components/ui/avatar";
// icons
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
// helpers
import { renderShortNumericDateFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, Properties } from "types";
// constants
import { getPriorityIcon } from "constants/global";

type Props = {
  type?: string;
  issue: IIssue;
  properties: Properties;
  editIssue?: () => void;
  handleDeleteIssue?: () => void;
  removeIssue?: () => void;
};

export const MyIssuesListItem: React.FC<Props> = ({ issue, properties }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div key={issue.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full`}
          style={{
            backgroundColor: issue.state_detail.color,
          }}
        />
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
          <a className="group relative flex items-center gap-2">
            {properties?.key && (
              <span className="flex-shrink-0 text-xs text-gray-500">
                {issue.project_detail?.identifier}-{issue.sequence_id}
              </span>
            )}
            <span>{issue.name}</span>
          </a>
        </Link>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-1 gap-y-2 text-xs">
        {properties.priority && (
          <div
            className={`group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              issue.priority === "urgent"
                ? "bg-red-100 text-red-600"
                : issue.priority === "high"
                ? "bg-orange-100 text-orange-500"
                : issue.priority === "medium"
                ? "bg-yellow-100 text-yellow-500"
                : issue.priority === "low"
                ? "bg-green-100 text-green-500"
                : "bg-gray-100"
            }`}
          >
            {getPriorityIcon(issue.priority)}
            <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
              <h5 className="mb-1 font-medium text-gray-900">Priority</h5>
              <div
                className={`capitalize ${
                  issue.priority === "urgent"
                    ? "text-red-600"
                    : issue.priority === "high"
                    ? "text-orange-500"
                    : issue.priority === "medium"
                    ? "text-yellow-500"
                    : issue.priority === "low"
                    ? "text-green-500"
                    : ""
                }`}
              >
                {issue.priority ?? "None"}
              </div>
            </div>
          </div>
        )}
        {properties.state && (
          <div className="group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: issue?.state_detail?.color,
              }}
            />
            {addSpaceIfCamelCase(issue?.state_detail.name)}
            <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
              <h5 className="mb-1 font-medium">State</h5>
              <div>{issue?.state_detail.name}</div>
            </div>
          </div>
        )}
        {properties.due_date && (
          <div
            className={`group group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              issue.target_date === null
                ? ""
                : issue.target_date < new Date().toISOString()
                ? "text-red-600"
                : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
            }`}
          >
            <CalendarDaysIcon className="h-4 w-4" />
            {issue.target_date ? renderShortNumericDateFormat(issue.target_date) : "N/A"}
            <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
              <h5 className="mb-1 font-medium text-gray-900">Due date</h5>
              <div>{renderShortNumericDateFormat(issue.target_date ?? "")}</div>
              <div>
                {issue.target_date &&
                  (issue.target_date < new Date().toISOString()
                    ? `Due date has passed by ${findHowManyDaysLeft(issue.target_date)} days`
                    : findHowManyDaysLeft(issue.target_date) <= 3
                    ? `Due date is in ${findHowManyDaysLeft(issue.target_date)} days`
                    : "Due date")}
              </div>
            </div>
          </div>
        )}
        {properties.sub_issue_count && (
          <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {issue?.sub_issues_count} {issue?.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
          </div>
        )}
        {properties.assignee && (
          <div className="flex items-center gap-1">
            <AssigneesList userIds={issue.assignees ?? []} />
          </div>
        )}
      </div>
    </div>
  );
};
