import { Button } from "@plane/ui";
import { DetailedEmptyState } from "@/components/empty-state";
import { TimeLineTypeContext, ETimeLineTypeType } from "@/components/gantt-chart/contexts";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AddScopeButton } from "../../common/add-scope-button";
import { ScopeGanttChartRoot } from "./chart/chart-root";

type Props = {
  epicIds: string[];
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};
export const InitiativeScopeGanttView: React.FC<Props> = (props) => {
  const { epicIds, projectIds, workspaceSlug, handleAddEpic, handleAddProject, initiativeId, disabled } = props;

  const isEmpty = epicIds.length === 0 && projectIds.length === 0;

  const resolvedAssetPath = useResolvedAssetPath({ basePath: "/empty-state/initiatives/scope/initiatives-gantt" });

  if (isEmpty)
    return (
      <DetailedEmptyState
        assetPath={resolvedAssetPath}
        title={"No scope added yet."}
        description={"Add projects or epics to this initiative to get started."}
        customPrimaryButton={
          <AddScopeButton
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
            customButton={<Button>Add scope</Button>}
          />
        }
      />
    );

  return (
    <TimeLineTypeContext.Provider value={ETimeLineTypeType.GROUPED}>
      <ScopeGanttChartRoot
        epicIds={epicIds}
        projectIds={projectIds}
        workspaceSlug={workspaceSlug}
        handleAddEpic={handleAddEpic}
        handleAddProject={handleAddProject}
        initiativeId={initiativeId}
        disabled={disabled}
      />
    </TimeLineTypeContext.Provider>
  );
};
