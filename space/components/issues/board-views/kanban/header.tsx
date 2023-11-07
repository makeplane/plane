// mobx react lite
import { observer } from "mobx-react-lite";
// interfaces
import { IIssueState } from "types/issue";
// constants
import { issueGroupFilter } from "constants/data";
// ui
import { StateGroupIcon } from "@plane/ui";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueListHeader = observer(({ state }: { state: IIssueState }) => {
  const store: RootStore = useMobxStore();

  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;

  return (
    <div className="pb-2 px-2 flex items-center gap-2">
      <div className="w-3.5 h-3.5 flex justify-center items-center flex-shrink-0">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="font-semibold text-custom-text-200 capitalize mr-1 truncate">{state?.name}</div>
      <span className="text-custom-text-300 rounded-full flex-shrink-0">
        {store.issue.getCountOfIssuesByState(state.id)}
      </span>
    </div>
  );
});
