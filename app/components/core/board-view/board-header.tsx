import React from "react";

// react-beautiful-dnd
import { DraggableProvided } from "react-beautiful-dnd";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue } from "types";
type Props = {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  groupTitle: string;
  createdBy: string | null;
  bgColor?: string;
  addIssueToState: () => void;
};

export const BoardHeader: React.FC<Props> = ({
  isCollapsed,
  setIsCollapsed,
  groupedByIssues,
  groupTitle,
  createdBy,
  bgColor,
  addIssueToState,
}) => (
  <div
    className={`flex justify-between p-3 pb-0 ${
      !isCollapsed ? "flex-col rounded-md border bg-gray-50" : ""
    }`}
  >
    <div className={`flex items-center ${!isCollapsed ? "flex-col gap-2" : "gap-1"}`}>
      <div
        className={`flex cursor-pointer items-center gap-x-1 rounded-md bg-slate-900 px-2 ${
          !isCollapsed ? "mb-2 flex-col gap-y-2 py-2" : ""
        }`}
        style={{
          border: `2px solid ${bgColor}`,
          backgroundColor: `${bgColor}20`,
        }}
      >
        <h2
          className={`text-[0.9rem] font-medium capitalize`}
          style={{
            writingMode: !isCollapsed ? "vertical-rl" : "horizontal-tb",
          }}
        >
          {groupTitle === null || groupTitle === "null"
            ? "None"
            : createdBy
            ? createdBy
            : addSpaceIfCamelCase(groupTitle)}
        </h2>
        <span className="ml-0.5 text-sm text-gray-500">{groupedByIssues[groupTitle].length}</span>
      </div>
    </div>

    <div className={`flex items-center ${!isCollapsed ? "flex-col pb-2" : ""}`}>
      <button
        type="button"
        className="grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200"
        onClick={() => {
          setIsCollapsed((prevData) => !prevData);
        }}
      >
        {isCollapsed ? (
          <ArrowsPointingInIcon className="h-4 w-4" />
        ) : (
          <ArrowsPointingOutIcon className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        className="grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200"
        onClick={addIssueToState}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  </div>
);
