// ui
import { StateGroupIcon } from "@plane/ui";
// constants
import { issueGroupFilter } from "@/constants/issue";

export const IssueBlockState = ({ state }: any) => {
  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;
  return (
    <div className="flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 text-xs shadow-sm duration-300 focus:outline-none">
      <div className="flex w-full items-center gap-1.5 text-custom-text-200">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
        <div className="text-xs">{state?.name}</div>
      </div>
    </div>
  );
};
