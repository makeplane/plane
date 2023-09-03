import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { RenderIssuePriority } from "./filter-priority-block";
// interfaces
import { IIssuePriorityFilters } from "types/issue";
// constants
import { issuePriorityFilters } from "constants/data";

const IssuePriorityFilter = observer(() => {
  const store = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const clearPriorityFilters = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "priority",
    //     removeAll: true,
    //   })
    // );
  };

  return (
    <>
      <div className="flex items-center gap-2 border border-custom-border-300 px-2 py-1 rounded-full text-xs">
        <div className="flex-shrink-0 text-custom-text-200">Priority</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {/* {issuePriorityFilters.map(
            (_priority: IIssuePriorityFilters, _index: number) =>
              store.issue.getUserSelectedFilter("priority", _priority.key) && (
                <RenderIssuePriority key={_priority.key} priority={_priority} />
              )
          )} */}
        </div>
        <div
          className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-sm"
          onClick={() => {
            clearPriorityFilters();
          }}
        >
          <span className="material-symbols-rounded text-[12px]">close</span>
        </div>
      </div>
    </>
  );
});

export default IssuePriorityFilter;
