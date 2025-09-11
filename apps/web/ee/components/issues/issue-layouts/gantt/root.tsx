import React from "react";
import { observer } from "mobx-react";
// components
import { ETimeLineTypeType, TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// local imports
import { WorkspaceGanttChart } from "./workspace-gantt-chart";

type Props = {
  isLoading?: boolean;
  workspaceSlug: string;
  globalViewId: string;
  fetchNextPages: () => void;
  issuesLoading: boolean;
};

export const WorkspaceGanttRoot: React.FC<Props> = observer((props: Props) => {
  const { isLoading = false, workspaceSlug, globalViewId, fetchNextPages, issuesLoading } = props;

  return (
    <TimeLineTypeContext.Provider value={ETimeLineTypeType.ISSUE}>
      <WorkspaceGanttChart
        isLoading={isLoading}
        workspaceSlug={workspaceSlug}
        globalViewId={globalViewId}
        fetchNextPages={fetchNextPages}
        issuesLoading={issuesLoading}
      />
      {/* peek overview */}
      <IssuePeekOverview />
    </TimeLineTypeContext.Provider>
  );
});
