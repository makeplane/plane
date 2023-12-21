import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useIssues } from "hooks/store";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const CycleGanttLayout: React.FC = observer(() => {
  const router = useRouter();
  const { cycleId } = router.query;

  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  return <BaseGanttRoot issueFiltersStore={issuesFilter} issueStore={issues} viewId={cycleId?.toString()} />;
});
