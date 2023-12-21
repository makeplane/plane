import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const ModuleGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { moduleId } = router.query;

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  return <BaseGanttRoot issueFiltersStore={issuesFilter} issueStore={issues} viewId={moduleId?.toString()} />;
});
