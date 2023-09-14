import { useRouter } from "next/router";

// components
import { CycleIssuesGanttChartView } from "components/cycles";
import { IssueGanttChartView } from "components/issues";
import { ModuleIssuesGanttChartView } from "components/modules";
import { ViewIssuesGanttChartView } from "components/views";

type Props = {
  disableUserActions: boolean;
};

export const GanttChartView: React.FC<Props> = ({ disableUserActions }) => {
  const router = useRouter();
  const { cycleId, moduleId, viewId } = router.query;

  return (
    <>
      {cycleId ? (
        <CycleIssuesGanttChartView disableUserActions={disableUserActions} />
      ) : moduleId ? (
        <ModuleIssuesGanttChartView disableUserActions={disableUserActions} />
      ) : viewId ? (
        <ViewIssuesGanttChartView disableUserActions={disableUserActions} />
      ) : (
        <IssueGanttChartView disableUserActions={disableUserActions} />
      )}
    </>
  );
};
