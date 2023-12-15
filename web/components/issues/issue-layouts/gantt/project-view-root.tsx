import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const ProjectViewGanttLayout: React.FC = observer(() => {
  const { viewIssues: projectIssueViewStore, viewIssuesFilter: projectIssueViewFiltersStore } = useMobxStore();

  return <BaseGanttRoot issueFiltersStore={projectIssueViewFiltersStore} issueStore={projectIssueViewStore} />;
});
