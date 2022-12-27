// next
import Link from "next/link";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { CustomMenu } from "ui";
// icons
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, Properties } from "types";
// common
import {
  addSpaceIfCamelCase,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";

type Props = {
  type: string;
  issue: IIssue;
  properties: Properties;
  editIssue: () => void;
  handleDeleteIssue: () => void;
  removeIssue: () => void;
};

const SingleListIssue: React.FC<Props> = ({
  type,
  issue,
  properties,
  editIssue,
  handleDeleteIssue,
  removeIssue,
}) => {
  const { activeProject } = useUser();

  return (
    <div
      key={issue.id}
      className="px-4 py-3 text-sm rounded flex justify-between items-center gap-2"
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex-shrink-0 h-1.5 w-1.5 block rounded-full`}
          style={{
            backgroundColor: issue.state_detail.color,
          }}
        />
        <Link href={`/projects/${activeProject?.id}/issues/${issue.id}`}>
          <a className="group relative flex items-center gap-2">
            {properties.key && (
              <span className="flex-shrink-0 text-xs text-gray-500">
                {activeProject?.identifier}-{issue.sequence_id}
              </span>
            )}
            <span>{issue.name}</span>
            {/* <div className="absolute bottom-full left-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md max-w-sm whitespace-nowrap">
    <h5 className="font-medium mb-1">Name</h5>
    <div>{issue.name}</div>
  </div> */}
          </a>
        </Link>
      </div>
      <div className="flex-shrink-0 flex items-center gap-x-1 gap-y-2 text-xs flex-wrap">
        {properties.priority && (
          <div
            className={`group relative flex-shrink-0 flex items-center gap-1 text-xs rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize ${
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
            {/* {getPriorityIcon(issue.priority ?? "")} */}
            {issue.priority ?? "None"}
            <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
              <h5 className="font-medium mb-1 text-gray-900">Priority</h5>
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
          <div className="group relative flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
            <span
              className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: issue?.state_detail?.color,
              }}
            ></span>
            {addSpaceIfCamelCase(issue?.state_detail.name)}
            <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
              <h5 className="font-medium mb-1">State</h5>
              <div>{issue?.state_detail.name}</div>
            </div>
          </div>
        )}
        {properties.start_date && (
          <div className="group relative flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
            <CalendarDaysIcon className="h-4 w-4" />
            {issue.start_date ? renderShortNumericDateFormat(issue.start_date) : "N/A"}
            <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
              <h5 className="font-medium mb-1">Started at</h5>
              <div>{renderShortNumericDateFormat(issue.start_date ?? "")}</div>
            </div>
          </div>
        )}
        {properties.due_date && (
          <div
            className={`group relative flex-shrink-0 group flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 ${
              issue.target_date === null
                ? ""
                : issue.target_date < new Date().toISOString()
                ? "text-red-600"
                : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
            }`}
          >
            <CalendarDaysIcon className="h-4 w-4" />
            {issue.target_date ? renderShortNumericDateFormat(issue.target_date) : "N/A"}
            <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
              <h5 className="font-medium mb-1 text-gray-900">Due date</h5>
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
        <CustomMenu width="auto" ellipsis>
          <CustomMenu.MenuItem onClick={() => editIssue()}>Edit</CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => removeIssue()}>
            <>Remove from {type}</>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => handleDeleteIssue()}>
            Delete permanently
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
};

export default SingleListIssue;
