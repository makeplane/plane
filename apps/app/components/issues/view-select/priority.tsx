import React from "react";

// ui
import { CustomSelect, Tooltip } from "components/ui";
// icons
import { getPriorityIcon } from "components/icons/priority-icon";
// types
import { IIssue } from "types";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  selfPositioned?: boolean;
  isNotAllowed: boolean;
};

export const ViewPrioritySelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  selfPositioned = false,
  isNotAllowed,
}) => (
  <CustomSelect
    value={issue.state}
    onChange={(data: string) => {
      partialUpdateIssue({ priority: data });
    }}
    maxHeight="md"
    customButton={
      <button
        type="button"
        className={`grid place-items-center rounded w-6 h-6 ${
          isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
        } items-center shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
          issue.priority === "urgent"
            ? "bg-red-100 text-red-600 hover:bg-red-100"
            : issue.priority === "high"
            ? "bg-orange-100 text-orange-500 hover:bg-orange-100"
            : issue.priority === "medium"
            ? "bg-yellow-100 text-yellow-500 hover:bg-yellow-100"
            : issue.priority === "low"
            ? "bg-green-100 text-green-500 hover:bg-green-100"
            : "bg-gray-100"
        } border-none`}
      >
        <Tooltip tooltipHeading="Priority" tooltipContent={issue.priority ?? "None"}>
          <span>
            {getPriorityIcon(
              issue.priority && issue.priority !== "" ? issue.priority ?? "" : "None",
              "text-sm"
            )}
          </span>
        </Tooltip>
      </button>
    }
    noChevron
    disabled={isNotAllowed}
    selfPositioned={selfPositioned}
  >
    {PRIORITIES?.map((priority) => (
      <CustomSelect.Option key={priority} value={priority} className="capitalize">
        <>
          {getPriorityIcon(priority, "text-sm")}
          {priority ?? "None"}
        </>
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
