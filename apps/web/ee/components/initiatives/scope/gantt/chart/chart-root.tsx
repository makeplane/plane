import { useMemo } from "react";
import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { EGanttBlockType, EUserPermissions } from "@plane/types";
import { useUserPermissions } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { getBlockToRender, useGanttOperations } from "../helper";
import { GroupedGanttSidebar } from "../sidebar/root";
import { GroupedGanttChart } from "./group-chart";

type Props = {
  epicIds: string[];
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};
export const ScopeGanttChartRoot: React.FC<Props> = observer((props) => {
  const { epicIds, projectIds, workspaceSlug, handleAddEpic, handleAddProject } = props;

  const { blockStructureUpdateHandler, blockDatesUpdateHandler } = useGanttOperations(workspaceSlug);
  const { allowPermissions } = useUserPermissions();
  const { getBlockById } = useTimeLineChartStore();

  const groupedBlockIds = useMemo(
    () => [
      {
        type: EGanttBlockType.EPIC,
        blockIds: epicIds,
      },
      {
        type: EGanttBlockType.PROJECT,
        blockIds: projectIds,
      },
    ],
    [epicIds, projectIds]
  );

  const checkEditPermissions = (projectId: string) => {
    if (!projectId) return false;
    return allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug,
      projectId
    );
  };

  const isDependencyEnabled = (blockId: string): boolean => {
    const data = getBlockById(blockId);
    if (!data) return false;

    const type = data.meta?.type as EGanttBlockType;
    const projectId = data.meta?.project_id as string;

    // Project relations is not enabled yet.
    if (type === EGanttBlockType.PROJECT) return false;
    if (type === EGanttBlockType.EPIC) return checkEditPermissions(projectId);

    return false;
  };

  const handleAddBlock = async (type: EGanttBlockType) => {
    switch (type) {
      case EGanttBlockType.EPIC:
        return handleAddEpic();
      case EGanttBlockType.PROJECT:
        return handleAddProject();
    }
  };

  return (
    <div className="h-full w-full">
      <GroupedGanttChart
        border={false}
        title="Scope"
        blockGroups={groupedBlockIds}
        blockUpdateHandler={blockStructureUpdateHandler}
        blockToRender={getBlockToRender}
        sidebarToRender={(props) => <GroupedGanttSidebar {...props} showAllBlocks handleAddBlock={handleAddBlock} />}
        enableBlockLeftResize
        enableBlockRightResize
        enableBlockMove
        enableAddBlock
        enableSelection={false}
        showToday
        updateBlockDates={blockDatesUpdateHandler}
        showAllBlocks
        enableDependency={isDependencyEnabled}
      />
    </div>
  );
});
