import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { useRouter } from "next/router";

export const CycleGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { cycleId } = router.query;

  const { cycleIssues: cycleIssueStore, cycleIssuesFilter: cycleIssueFilterStore } = useMobxStore();

  return (
    <BaseGanttRoot
      issueFiltersStore={cycleIssueFilterStore}
      issueStore={cycleIssueStore}
      viewId={cycleId?.toString()}
    />
  );
});
