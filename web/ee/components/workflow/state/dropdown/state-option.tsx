import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { Tooltip, WorkflowIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// CE
import { StateOption as CEStateOption } from "@/ce/components/workflow";
// hooks
import { useProjectState } from "@/hooks/store";
// plane web imports
import { WorkFlowDisabledMessage } from "@/plane-web/components/workflow";

type Props = {
  projectId: string | null | undefined;
  option: {
    value: string | undefined;
    query: string;
    content: JSX.Element;
  };
  filterAvailableStateIds: boolean;
  selectedValue: string | null | undefined;
  isForWorkItemCreation?: boolean;
  className?: string;
};

export const StateOption = observer((props: Props) => {
  const { projectId, option, selectedValue, className, filterAvailableStateIds, isForWorkItemCreation = false } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    stateTransitionMap,
    getIsWorkflowEnabled,
    getAvailableProjectStateIdMap,
    getAvailableWorkItemCreationStateIdMap,
  } = useProjectState();
  // derived values
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), projectId);
  const availableStateIdMap = isForWorkItemCreation
    ? getAvailableWorkItemCreationStateIdMap(projectId)
    : getAvailableProjectStateIdMap(projectId, selectedValue);
  const isDisabled =
    selectedValue !== option.value && filterAvailableStateIds && !availableStateIdMap[option.value ?? ""];
  const stateTransition = stateTransitionMap[option.value ?? ""];
  const isTransitionEnabledForState = Object.keys(stateTransition ?? {})?.length > 0;

  if (!isWorkflowEnabled) {
    return (
      <CEStateOption
        className={className}
        projectId={projectId}
        option={option}
        filterAvailableStateIds={filterAvailableStateIds}
        selectedValue={selectedValue}
      />
    );
  }

  return (
    <Combobox.Option
      key={option.value}
      value={option.value}
      className={({ active, selected }) =>
        `${className} ${active ? "bg-custom-background-80" : ""} ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
      }
      disabled={isDisabled}
    >
      {({ selected }) => (
        <Tooltip
          tooltipContent={<WorkFlowDisabledMessage parentStateId={selectedValue ?? ""} />}
          position="right-top"
          disabled={!isDisabled}
        >
          <div
            className={cn("flex justify-between w-full", {
              "cursor-not-allowed text-custom-text-400": isDisabled,
            })}
          >
            <span className="flex-grow truncate">{option.content}</span>
            {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
            {isTransitionEnabledForState && !selected && <WorkflowIcon className="h-3.5 w-3.5 flex-shrink-0" />}
          </div>
        </Tooltip>
      )}
    </Combobox.Option>
  );
});
