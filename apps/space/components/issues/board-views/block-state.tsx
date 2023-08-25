"use client";

// constants
import { issueGroupFilter } from "constants/data";

export const IssueBlockState = ({ state }: any) => {
  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;
  return (
    <div className="flex items-center justify-between gap-1 w-full rounded-md shadow-sm border border-custom-border-300 duration-300 focus:outline-none px-2.5 py-1 text-xs cursor-pointer hover:bg-custom-background-80">
      <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
        <stateGroup.icon />
        <div className="text-xs">{state?.name}</div>
      </div>
    </div>
  );
};
