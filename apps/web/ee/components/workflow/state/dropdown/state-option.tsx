import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// CE
import { StateOption as CEStateOption, TStateOptionProps } from "@/ce/components/workflow";
// hooks
import { useProjectState } from "@/hooks/store";
// plane web imports
import { WorkFlowDisabledMessage } from "@/plane-web/components/workflow";

export const StateOption = observer((props: TStateOptionProps) => {
  const {
    projectId,
    option,
    selectedValue,
    className,
    filterAvailableStateIds = true,
    isForWorkItemCreation = false,
    alwaysAllowStateChange = false,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getIsWorkflowEnabled, getAvailableProjectStateIdMap, getAvailableWorkItemCreationStateIdMap } =
    useProjectState();
  // derived values
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), projectId);
  const availableStateIdMap = isForWorkItemCreation
    ? getAvailableWorkItemCreationStateIdMap(projectId)
    : getAvailableProjectStateIdMap(projectId, selectedValue);
  const isDisabled =
    selectedValue !== option.value && filterAvailableStateIds && !availableStateIdMap[option.value ?? ""];

  if (!isWorkflowEnabled || alwaysAllowStateChange) {
    return <CEStateOption {...props} />;
  }

  return (
    <Tooltip
      tooltipContent={
        isForWorkItemCreation ? (
          <div className="py-1.5 px-1">{t("workflows.workflow_states.work_item_creation_disable_tooltip")}</div>
        ) : (
          <WorkFlowDisabledMessage parentStateId={selectedValue ?? ""} />
        )
      }
      className="border-[0.5px] border-custom-border-300 mx-0.5 shadow-lg"
      position={isForWorkItemCreation ? "right" : "right-top"}
      disabled={!isDisabled}
    >
      <div>
        <Combobox.Option
          key={option.value}
          value={option.value}
          className={({ active, selected }) =>
            cn(
              className,
              active ? "bg-custom-background-80" : "",
              selected ? "text-custom-text-100" : "text-custom-text-200",
              { "cursor-not-allowed text-custom-text-400 hover:bg-custom-background-90": isDisabled }
            )
          }
          disabled={isDisabled}
        >
          {({ selected }) => (
            <div className={cn("flex justify-between w-full")}>
              <span className="flex-grow truncate">{option.content}</span>
              {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
            </div>
          )}
        </Combobox.Option>
      </div>
    </Tooltip>
  );
});
