import { useRouter } from "next/router";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssuePriorityFilters } from "types/issue";

export const RenderIssuePriority = observer(({ priority }: { priority: IIssuePriorityFilters }) => {
  const store = useMobxStore();

  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as { workspace_slug: string; project_slug: string };

  const removePriorityFromFilter = () => {
    // router.replace(
    //   store.issue.getURLDefinition(workspace_slug, project_slug, {
    //     key: "priority",
    //     value: priority?.key,
    //   })
    // );
  };

  return (
    <div
      className={`flex-shrink-0 relative flex items-center flex-wrap gap-1 px-2 py-0.5 text-xs rounded-full select-none ${
        priority.className || ``
      }`}
    >
      <div className="flex-shrink-0 flex justify-center items-center overflow-hidden rounded-full">
        <span className="material-symbols-rounded text-xs">{priority?.icon}</span>
      </div>
      <div className="whitespace-nowrap">{priority?.title}</div>
      <div
        className="flex-shrink-0 w-3 h-3 cursor-pointer flex justify-center items-center overflow-hidden rounded-full"
        onClick={removePriorityFromFilter}
      >
        <span className="material-symbols-rounded text-xs">close</span>
      </div>
    </div>
  );
});
