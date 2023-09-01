import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// components
import IssueStateFilter from "./state";
import IssueLabelFilter from "./label";
import IssuePriorityFilter from "./priority";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const IssueFilter = observer(() => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const clearAllFilters = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "all",
    //     removeAll: true,
    //   })
    // );
  };

  // if (store.issue.getIfFiltersIsEmpty()) return null;

  return (
    <div className="flex-shrink-0 min-h-[50px] h-auto py-1.5 border-b border-custom-border-200 relative flex items-center shadow-md bg-whiate select-none">
      <div className="px-5 flex justify-start items-center flex-wrap gap-2 text-sm">
        {/* state */}
        {/* {store.issue.checkIfFilterExistsForKey("state") && <IssueStateFilter />} */}
        {/* labels */}
        {/* {store.issue.checkIfFilterExistsForKey("label") && <IssueLabelFilter />} */}
        {/* priority */}
        {/* {store.issue.checkIfFilterExistsForKey("priority") && <IssuePriorityFilter />} */}
        {/* clear all filters */}
        <div
          className="flex items-center gap-2 border border-custom-border-200 px-2 py-1 cursor-pointer text-xs rounded-full"
          onClick={clearAllFilters}
        >
          <div>Clear all filters</div>
          <div className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-sm">
            <span className="material-symbols-rounded text-[12px]">close</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default IssueFilter;
