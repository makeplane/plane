import { useRouter } from "next/router";

// components
import { CycleIssuesGanttChartView } from "components/cycles";
import { IssueGanttChartView } from "components/issues/gantt-chart";
import { ModuleIssuesGanttChartView } from "components/modules";
import { ViewIssuesGanttChartView } from "components/views";

export const GanttChartView = () => {
  const router = useRouter();
  const { cycleId, moduleId, viewId } = router.query;

  return (
    <>
      {cycleId ? (
        <CycleIssuesGanttChartView />
      ) : moduleId ? (
        <ModuleIssuesGanttChartView />
      ) : viewId ? (
        <ViewIssuesGanttChartView />
      ) : (
        <IssueGanttChartView />
      )}
    </>
  );
};
