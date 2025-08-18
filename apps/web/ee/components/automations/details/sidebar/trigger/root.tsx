import { useMemo, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { ChevronDown, Zap } from "lucide-react";
// plane imports
import { AUTOMATION_TRIGGER_SELECT_OPTIONS, DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  EAutomationSidebarTab,
  ICustomSearchSelectOption,
  TAutomationConditionFilterExpression,
  TTriggerNodeHandlerName,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, generateConditionPayload } from "@plane/utils";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActionButtons } from "../action-buttons";
import { AutomationDetailsSidebarTriggerConditionRoot } from "./condition/root";
import { AutomationTriggerIcon } from "./icon";

type Props = {
  automationId: string;
};

const AUTOMATION_TRIGGER_SELECT_OPTIONS_WITH_CONTENT: ICustomSearchSelectOption[] =
  AUTOMATION_TRIGGER_SELECT_OPTIONS.map((option) => ({
    value: option.value,
    query: option.label,
    content: (
      <span className="flex items-center gap-2">
        <AutomationTriggerIcon iconKey={option.iconKey} />
        {option.label}
      </span>
    ),
  }));

export const AutomationDetailsSidebarTriggerRoot: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const triggerNode = automation?.trigger;
  const conditionNode = automation?.allConditions?.[0];
  const filterExpression = conditionNode?.config?.filter_expression;
  const triggerNodeHandlerName = triggerNode?.handler_name;
  // states
  const [isCreatingUpdatingTrigger, setIsCreatingUpdatingTrigger] = useState(false);
  const [isCreatingUpdatingCondition, setIsCreatingUpdatingCondition] = useState(false);
  const [selectedTriggerNodeHandlerName, setSelectedTriggerNodeHandlerName] = useState<TTriggerNodeHandlerName | null>(
    triggerNodeHandlerName ?? null
  );
  const [selectedFilterExpression, setSelectedFilterExpression] = useState<TAutomationConditionFilterExpression>(
    filterExpression ?? DEFAULT_AUTOMATION_CONDITION_FILTER_EXPRESSION
  );
  // derived states
  const selectedTriggerNodeHandlerOption = useMemo(
    () => AUTOMATION_TRIGGER_SELECT_OPTIONS.find((option) => option.value === selectedTriggerNodeHandlerName),
    [selectedTriggerNodeHandlerName]
  );

  const createOrUpdateTrigger = async () => {
    if (!automation || !selectedTriggerNodeHandlerName) return;

    // If trigger node doesn't exist, create it with the selected handler and condition.
    if (!triggerNode) {
      try {
        await automation.createTrigger({
          handler_name: selectedTriggerNodeHandlerName,
          conditionPayload: {
            config: {
              filter_expression: selectedFilterExpression,
            },
          },
        });
      } catch (error) {
        console.error("Failed to create trigger:", error);
      }
      return;
    }

    // If handler name changed, update the trigger node.
    if (triggerNode.handler_name !== selectedTriggerNodeHandlerName) {
      try {
        await triggerNode.update({
          handler_name: selectedTriggerNodeHandlerName,
        });
      } catch (error) {
        console.error("Failed to update trigger handler:", error);
      }
    }
  };

  const createOrUpdateCondition = async () => {
    if (!automation || !selectedFilterExpression || !selectedTriggerNodeHandlerName) return;

    // If condition node doesn't exist, create it.
    if (!conditionNode) {
      try {
        const conditionPayload = generateConditionPayload({
          triggerHandlerName: selectedTriggerNodeHandlerName,
          conditionPayload: {
            config: {
              filter_expression: selectedFilterExpression,
            },
          },
        });
        await automation.createCondition(conditionPayload);
      } catch (error) {
        console.error("Failed to create condition:", error);
      }
      return;
    }

    // If filter expression changed, update the condition node.
    if (!isEqual(conditionNode.config.filter_expression, selectedFilterExpression)) {
      try {
        await conditionNode.update({
          config: {
            filter_expression: selectedFilterExpression,
          },
        });
      } catch (error) {
        console.error("Failed to update condition:", error);
      }
    }
  };

  const handleNextButtonClick = async () => {
    setIsCreatingUpdatingTrigger(true);
    setIsCreatingUpdatingCondition(true);

    try {
      await createOrUpdateTrigger();
      setIsCreatingUpdatingTrigger(false);

      await createOrUpdateCondition();
      setIsCreatingUpdatingCondition(false);

      sidebarHelper?.setSelectedSidebarConfig({
        tab: EAutomationSidebarTab.ACTION,
        mode: automation?.isAnyActionNodeAvailable ? "view" : "create",
      });
    } catch (error) {
      console.error("Failed to proceed to next step:", error);
      setIsCreatingUpdatingTrigger(false);
      setIsCreatingUpdatingCondition(false);
    }
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
        <CustomSearchSelect
          options={AUTOMATION_TRIGGER_SELECT_OPTIONS_WITH_CONTENT}
          value={selectedTriggerNodeHandlerName}
          onChange={(value: TTriggerNodeHandlerName) => {
            setSelectedTriggerNodeHandlerName(value);
          }}
          customButtonClassName="w-full"
          customButton={
            <span
              className={cn(
                "w-full px-4 py-1.5 rounded-md border-[0.5px] border-custom-border-200 hover:bg-custom-background-80 text-left flex items-center gap-2 cursor-pointer transition-colors",
                {
                  "text-custom-text-400 border border-custom-primary-200": !selectedTriggerNodeHandlerName,
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
        />
      </div>
      <AutomationDetailsSidebarTriggerConditionRoot
        automationId={automationId}
        initialFilterExpression={selectedFilterExpression}
        updateFilterExpression={setSelectedFilterExpression}
      />
      <AutomationDetailsSidebarActionButtons
        previousButton={{
          label: t("automations.trigger.button.previous"),
          isDisabled: true,
        }}
        nextButton={{
          label: isCreatingUpdatingTrigger
            ? t("common.confirming")
            : triggerNode
              ? t("common.continue")
              : t("automations.trigger.button.next"),
          isDisabled: !selectedTriggerNodeHandlerName || isCreatingUpdatingTrigger || isCreatingUpdatingCondition,
          onClick: handleNextButtonClick,
        }}
      />
    </section>
  );
});
