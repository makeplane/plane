import { observer } from "mobx-react-lite";
// mobx store
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewGanttLayout: React.FC = observer(() => {
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  return <BaseGanttRoot issueFiltersStore={issuesFilter} issueStore={issues} />;
});
