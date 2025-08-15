import { useEffect, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { ChevronDown, Zap } from "lucide-react";
// plane imports
import { AUTOMATION_TRIGGER_SELECT_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EAutomationSidebarTab, TAutomationConditionFilterExpression, TTriggerNodeHandlerName } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActionButtons } from "../action-buttons";
import { AutomationDetailsSidebarTriggerConditionRoot } from "./condition/root";
import { AutomationTriggerIcon } from "./icon";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarTriggerRoot: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // states
  const [selectedTriggerNodeHandlerName, setSelectedTriggerNodeHandlerName] = useState<TTriggerNodeHandlerName | null>(
    null
  );
  const [isCreatingUpdatingTriggerOrCondition, setIsCreatingUpdatingTriggerOrCondition] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const triggerNode = automation?.trigger;
  const conditionNode = automation?.allConditions?.[0];
  const actionNode = automation?.allActions?.[0];
  const filterExpression = conditionNode?.config?.filter_expression;
  const triggerNodeHandlerName = triggerNode?.handler_name;
  const selectedTriggerNodeHandlerOption = useMemo(
    () => AUTOMATION_TRIGGER_SELECT_OPTIONS.find((option) => option.value === selectedTriggerNodeHandlerName),
    [selectedTriggerNodeHandlerName]
  );
  // states
  const [conditionFilterExpression, setConditionFilterExpression] = useState<
    TAutomationConditionFilterExpression | undefined
  >(filterExpression);

  useEffect(() => {
    if (triggerNodeHandlerName) {
      setSelectedTriggerNodeHandlerName(triggerNodeHandlerName);
    }
  }, [triggerNodeHandlerName]);

  const handleNextButtonClick = async () => {
    setIsCreatingUpdatingTriggerOrCondition(true);
    if (automation && selectedTriggerNodeHandlerName) {
      if (!triggerNode) {
        const { condition } = await automation.createTrigger({
          handler_name: selectedTriggerNodeHandlerName,
        });
        setConditionFilterExpression(condition.config.filter_expression);
      } else {
        if (triggerNode.handler_name !== selectedTriggerNodeHandlerName) {
          await triggerNode.update({
            handler_name: selectedTriggerNodeHandlerName,
          });
        }
        if (conditionNode && conditionFilterExpression && !isEqual(filterExpression, conditionFilterExpression)) {
          await conditionNode.update({
            config: {
              filter_expression: conditionFilterExpression,
            },
          });
        }
        sidebarHelper?.setSelectedSidebarConfig({
          tab: EAutomationSidebarTab.ACTION,
          mode: automation.isAnyActionNodeAvailable ? "view" : "create",
        });
      }
    }
    setIsCreatingUpdatingTriggerOrCondition(false);
  };

  const getNextButtonLabel = () => {
    if (isCreatingUpdatingTriggerOrCondition) return t("common.confirming");
    if (!triggerNode) return t("automations.trigger.button.next.continue"); // No trigger node yet: prompt to continue to add condition node
    if (!actionNode) return t("automations.trigger.button.next.add_action"); // No action node yet: prompt to add an action
    return t("automations.trigger.button.next.continue");
  };

  if (!automation) return null;
  return (
    <section className="flex-grow space-y-6">
      <div className="space-y-2 px-6">
        <div className="flex items-center gap-1">
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <Zap className="size-3" />
          </span>
          <p className="text-xs font-medium">{t("automations.trigger.input_label")}</p>
        </div>
        <CustomSelect
          customButton={
            <span
              className={cn(
                "w-full px-4 py-1.5 rounded-md border-[0.5px] border-custom-border-200 hover:bg-custom-background-80 text-left flex items-center gap-2 cursor-pointer transition-colors",
                {
                  "text-custom-text-400": !selectedTriggerNodeHandlerName,
                }
              )}
            >
              <span className="flex flex-grow items-center gap-2">
                {selectedTriggerNodeHandlerOption ? (
                  <>
                    <AutomationTriggerIcon iconKey={selectedTriggerNodeHandlerOption.iconKey} />
                    {selectedTriggerNodeHandlerOption.label}
                  </>
                ) : (
                  t("automations.trigger.input_placeholder")
                )}
              </span>
              <ChevronDown className="flex-shrink-0 size-3" />
            </span>
          }
          customButtonClassName="w-full"
          value={selectedTriggerNodeHandlerName}
          onChange={(value: TTriggerNodeHandlerName) => {
            setSelectedTriggerNodeHandlerName(value);
          }}
        >
          {AUTOMATION_TRIGGER_SELECT_OPTIONS.map((option) => (
            <CustomSelect.Option key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <AutomationTriggerIcon iconKey={option.iconKey} />
                {option.label}
              </span>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
      <AutomationDetailsSidebarTriggerConditionRoot
        automationId={automationId}
        isLoading={isCreatingUpdatingTriggerOrCondition}
        triggerNode={triggerNode}
        conditionNode={conditionNode}
        filterExpression={conditionFilterExpression}
        updateFilterExpression={setConditionFilterExpression}
      />
      <AutomationDetailsSidebarActionButtons
        previousButton={{
          label: t("automations.trigger.button.previous"),
          isDisabled: true,
        }}
        nextButton={{
          label: getNextButtonLabel(),
          isDisabled: !selectedTriggerNodeHandlerName || isCreatingUpdatingTriggerOrCondition,
          onClick: handleNextButtonClick,
        }}
      />
    </section>
  );
});
