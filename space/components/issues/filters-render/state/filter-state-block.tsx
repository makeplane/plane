import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssueState } from "types/issue";
// constants
import { issueGroupFilter } from "constants/data";

export const RenderIssueState = observer(({ state }: { state: IIssueState }) => {
  const store = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

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
      <div className="flex-shrink-0 w-3 h-3 flex justify-center items-center overflow-hidden rounded-full">
        <stateGroup.icon />
      </div>
      <div className="text-xs font-medium whitespace-nowrap">{state?.name}</div>
      <div
        className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-full"
        onClick={removeStateFromFilter}
      >
        <span className="material-symbols-rounded text-xs">close</span>
      </div>
    </div>
  );
});
