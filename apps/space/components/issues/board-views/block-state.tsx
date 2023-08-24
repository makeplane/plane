"use client";

// constants
import { issueGroupFilter } from "constants/data";

export const IssueBlockState = ({ state }: any) => {
  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;
  return (
    <div
      className={`h-[24px] rounded-md flex px-2.5 py-1 items-center border ${stateGroup?.className} gap-2 !bg-transparent !text-gray-700`}
    >
      <stateGroup.icon />
      <div className="text-xs">{state?.name}</div>
    </div>
  );
};
