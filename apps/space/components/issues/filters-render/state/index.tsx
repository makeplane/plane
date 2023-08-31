import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { RenderIssueState } from "./filter-state-block";
// interfaces
import { IIssueState } from "types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const IssueStateFilter = observer(() => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const clearStateFilters = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "state",
    //     removeAll: true,
    //   })
    // );
  };

  return (
    <>
      <div className="flex items-center gap-2 border border-custom-border-300 px-2 py-1 rounded-full text-xs">
        <div className="flex-shrink-0 text-custom-text-200">State</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {/* {store?.issue?.states &&
            store?.issue?.states.map(
              (_state: IIssueState, _index: number) =>
                store.issue.getUserSelectedFilter("state", _state.id) && (
                  <RenderIssueState key={_state.id} state={_state} />
                )
            )} */}
        </div>
        <div
          className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-sm"
          onClick={clearStateFilters}
        >
          <span className="material-symbols-rounded text-[12px]">close</span>
        </div>
      </div>
    </>
  );
});

export default IssueStateFilter;
