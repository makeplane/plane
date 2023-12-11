import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { useRouter } from "next/router";

export const ModuleGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId } = router.query;

  const { moduleIssues: moduleIssueStore, moduleIssuesFilter: moduleIssueFilterStore } = useMobxStore();

  return (
    <BaseGanttRoot
      issueFiltersStore={moduleIssueFilterStore}
      issueStore={moduleIssueStore}
      viewId={moduleId?.toString()}
    />
  );
});
