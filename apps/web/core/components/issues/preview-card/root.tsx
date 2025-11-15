import { observer } from "mobx-react";
// plane imports
import { PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TIssue, TStateGroups } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { WorkItemPreviewCardLogo } from "@/plane-web/components/issues/preview-card/logo";
// local imports
import { WorkItemPreviewCardDate } from "./date";

type Props = {
  projectId: string;
  stateDetails: {
    group?: TStateGroups;
    id?: string;
    name?: string;
  };
  workItem: Pick<TIssue, "name" | "sequence_id" | "priority" | "start_date" | "target_date" | "type_id">;
};

export const WorkItemPreviewCard: React.FC<Props> = observer((props) => {
  const { projectId, stateDetails, workItem } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const { getStateById } = useProjectState();
  // derived values
  const projectIdentifier = getProjectIdentifierById(projectId);
  const fallbackStateDetails = stateDetails.id ? getStateById(stateDetails.id) : undefined;
  const stateGroup = stateDetails?.group ?? fallbackStateDetails?.group ?? "backlog";
  const stateName = stateDetails?.name ?? fallbackStateDetails?.name;

  return (
    <div className="p-3 space-y-2 w-72 rounded-lg shadow-custom-shadow-rg bg-custom-background-100 border-[0.5px] border-custom-border-300">
      <div className="flex items-center justify-between gap-3 text-custom-text-200">
        <div className="shrink-0 flex items-center gap-1">
          <WorkItemPreviewCardLogo
            className="shrink-0 size-4"
            projectId={projectId}
            workItemTypeId={workItem.type_id}
          />
          <p className="text-xs font-medium">
            {projectIdentifier}-{workItem.sequence_id}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <StateGroupIcon stateGroup={stateGroup} className="shrink-0 size-3" />
          <p className="text-xs font-medium">{stateName}</p>
        </div>
      </div>
      <div>
        <h6 className="text-sm">{workItem.name}</h6>
      </div>
      <div className="flex items-center gap-1 h-5">
        <PriorityIcon priority={workItem.priority} withContainer />
        <WorkItemPreviewCardDate
          startDate={workItem.start_date}
          stateGroup={stateGroup}
          targetDate={workItem.target_date}
        />
      </div>
    </div>
  );
});
