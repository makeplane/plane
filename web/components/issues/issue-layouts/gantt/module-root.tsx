import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const ModuleGanttLayout: React.FC = observer(() => {
  const { moduleIssues: moduleIssueStore, moduleIssuesFilter: moduleIssueFilterStore } = useMobxStore();

  return <BaseGanttRoot issueFiltersStore={moduleIssueFilterStore} issueRootStore={moduleIssueStore} />;
});
