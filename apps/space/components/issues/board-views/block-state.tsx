"use client";

// constants
import { issueGroupFilter } from "constants/data";

export const IssueBlockState = ({ state }: any) => {
  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;
  return (
    <div
      className={`h-[24px] rounded-sm flex px-1 items-center border ${stateGroup?.className} gap-1 !bg-transparent !text-gray-700`}
    >
      <stateGroup.icon />
      <div className="text-sm">{state?.name}</div>
    </div>
  );
};
