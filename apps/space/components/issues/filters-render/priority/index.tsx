"use client";

import { useRouter, useParams } from "next/navigation";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { RenderIssuePriority } from "./filter-priority-block";
// interfaces
import { IIssuePriorityFilters } from "store/types/issue";
// constants
import { issuePriorityFilters } from "constants/data";

const IssuePriorityFilter = observer(() => {
  const store = useMobxStore();

  const router = useRouter();
  const routerParams = useParams();

  const { workspace_slug, project_slug } = routerParams as { workspace_slug: string; project_slug: string };

  const clearPriorityFilters = () => {
    router.replace(
      store.issue.getURLDefinition(workspace_slug, project_slug, {
        key: "priority",
        removeAll: true,
      })
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 border border-gray-300 px-2 py-1 pr-1 rounded">
        <div className="flex-shrink-0 font-medium">Priority</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {issuePriorityFilters.map(
            (_priority: IIssuePriorityFilters, _index: number) =>
              store.issue.getUserSelectedFilter("priority", _priority.key) && (
                <RenderIssuePriority priority={_priority} />
              )
          )}
        </div>
        <div
          className={`w-[20px] h-[20px] cursor-pointer flex justify-center items-center overflow-hidden rounded-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-600`}
          onClick={() => {
            clearPriorityFilters();
          }}
        >
          <span className={`material-symbols-rounded text-[16px]`}>close</span>
        </div>
      </div>
    </>
  );
});

export default IssuePriorityFilter;
