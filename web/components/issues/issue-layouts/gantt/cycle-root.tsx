import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const CycleGanttLayout: React.FC = observer(() => {
  const { cycleIssues: cycleIssueStore, cycleIssuesFilter: cycleIssueFilterStore } = useMobxStore();

  return <BaseGanttRoot issueFiltersStore={cycleIssueFilterStore} issueRootStore={cycleIssueStore} />;
});
