import { observer } from "mobx-react-lite";
// interfaces
import { IIssueState } from "types/issue";
// constants
import { issueGroupFilter } from "constants/data";

export const RenderIssueState = observer(({ state }: { state: IIssueState }) => {
  const stateGroup = issueGroupFilter(state.group);

  const removeStateFromFilter = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "state",
    //     value: state?.id,
    //   })
    // );
  };

  if (stateGroup === null) return <></>;
  return (
    <div className={`inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 ${stateGroup.className || ``}`}>
      <div className="flex h-3 w-3 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
        {/* <stateGroup.icon /> */}
      </div>
      <div className="whitespace-nowrap text-xs font-medium">{state?.name}</div>
      <div
        className="flex h-3 w-3 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full"
        onClick={removeStateFromFilter}
      >
        <span className="material-symbols-rounded text-xs">close</span>
      </div>
    </div>
  );
});
