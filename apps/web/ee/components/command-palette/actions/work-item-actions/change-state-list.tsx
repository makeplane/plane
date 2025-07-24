import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
// plane imports
import { EIconSize } from "@plane/constants";
import { StateGroupIcon, Tooltip, Spinner } from "@plane/ui";
// ce imports
import {
  TChangeWorkItemStateListProps,
  ChangeWorkItemStateList as ChangeWorkItemStateListCE,
} from "@/ce/components/command-palette/actions/work-item-actions";
// store hooks
import { useProjectState } from "@/hooks/store";
// plane web imports
import { WorkFlowDisabledMessage } from "@/plane-web/components/workflow";

export const ChangeWorkItemStateList = observer((props: TChangeWorkItemStateListProps) => {
  const { projectId, currentStateId, handleStateChange } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectStates, getIsWorkflowEnabled, getAvailableProjectStateIdMap } = useProjectState();
  // derived values
  const projectStates = getProjectStates(projectId);
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), projectId);
  const availableStateIdMap = getAvailableProjectStateIdMap(projectId, currentStateId);

  if (!isWorkflowEnabled) {
    return <ChangeWorkItemStateListCE {...props} />;
  }

  const getIsDisabled = (selectedStateId: string) =>
    selectedStateId !== currentStateId && !availableStateIdMap[selectedStateId];

  return (
    <>
      {projectStates ? (
        projectStates.length > 0 ? (
          projectStates.map((state) => {
            const isDisabled = getIsDisabled(state.id);
            const isSelected = state.id === currentStateId;
            return (
              <Tooltip
                key={state.id}
                tooltipContent={<WorkFlowDisabledMessage parentStateId={currentStateId ?? ""} />}
                position="right-top"
                className="border-[0.5px] border-custom-border-300 mx-0.5 shadow-lg"
                disabled={!isDisabled}
              >
                <Command.Item
                  key={state.id}
                  onSelect={() => handleStateChange(state.id)}
                  className={"focus:outline-none"}
                  disabled={isDisabled}
                >
                  <div className="flex items-center space-x-3">
                    <StateGroupIcon stateGroup={state.group} color={state.color} size={EIconSize.MD} />
                    <p>{state.name}</p>
                  </div>
                  <div>{isSelected && <Check className="h-3 w-3" />}</div>
                </Command.Item>
              </Tooltip>
            );
          })
        ) : (
          <div className="text-center">No states found</div>
        )
      ) : (
        <Spinner />
      )}
    </>
  );
});
