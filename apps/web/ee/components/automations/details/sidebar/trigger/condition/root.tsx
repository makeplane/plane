import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  EConditionNodeHandlerName,
  LOGICAL_OPERATOR,
  TAutomationConditionFilterExpression,
  TAutomationConditionNode,
  TAutomationTriggerNode,
} from "@plane/types";
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { AddFilterButton } from "@/plane-web/components/rich-filters/add-filters-button";
import { FilterItem } from "@/plane-web/components/rich-filters/filter-item";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationConditionFilterHOC } from "./filter-provider";

type Props = {
  automationId: string;
  isLoading: boolean;
  triggerNode: TAutomationTriggerNode | undefined;
  conditionNode: TAutomationConditionNode | undefined;
  filterExpression: TAutomationConditionFilterExpression | undefined;
  updateFilterExpression: (updatedFilters: TAutomationConditionFilterExpression) => void;
};

export const AutomationDetailsSidebarTriggerConditionRoot: React.FC<Props> = observer((props) => {
  const { automationId, isLoading, triggerNode, conditionNode, filterExpression, updateFilterExpression } = props;
  // states
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [isConditionAdded, setIsConditionAdded] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);

  const handleAddCondition = async () => {
    setIsAddingCondition(true);
    await automation
      ?.createCondition({
        name: `Condition_${new Date().toISOString()}`,
        handler_name: EConditionNodeHandlerName.JSON_FILTER,
        config: {
          filter_expression: {
            [LOGICAL_OPERATOR.AND]: [],
          },
        },
      })
      .then(() => {
        setIsConditionAdded(true);
      });
    setIsAddingCondition(false);
    setIsConditionAdded(true);
  };

  if (!automation) return null;
  if (triggerNode && !conditionNode && !isLoading) {
    return (
      <div className="px-6">
        <Button
          variant="accent-primary"
          size="sm"
          onClick={handleAddCondition}
          loading={isAddingCondition}
          disabled={isAddingCondition}
        >
          {isAddingCondition ? t("automations.condition.adding_condition") : t("automations.condition.add_condition")}
        </Button>
      </div>
    );
  }

  return (
    <AutomationConditionFilterHOC
      projectId={automation.project}
      workspaceSlug={automation.workspaceSlug}
      initialFilterExpression={filterExpression}
      updateFilterExpression={updateFilterExpression}
    >
      {({ filter }) => (
        <section className="space-y-2">
          {filter && (
            <div className="space-y-2 px-6">
              <p className="text-xs font-medium">{t("automations.condition.label")}</p>
              <div className="flex flex-col items-start">
                {filter.allConditions.map((condition, index) => (
                  <div key={condition.id} className="flex flex-col items-start">
                    <div className="w-fit">
                      <FilterItem filter={filter} condition={condition} showTransition={false} />
                    </div>
                    {index < filter.allConditions.length - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="h-2 border-l border-dashed border-custom-border-300" />
                        <span className="text-xs font-medium uppercase text-custom-text-400 px-2 py-0.5 bg-custom-background-80 rounded-sm">
                          {t("automations.conjunctions.and")}
                        </span>
                        <div className="h-2 border-l border-dashed border-custom-border-300" />
                      </div>
                    )}
                  </div>
                ))}
                <div
                  className={cn("w-fit", {
                    "pt-3": filter.allConditions.length > 0,
                  })}
                >
                  <AddFilterButton
                    filter={filter}
                    buttonConfig={{
                      label: t("automations.condition.add_condition"),
                      variant: "accent-primary",
                      defaultOpen: isConditionAdded,
                      iconConfig: {
                        shouldShowIcon: false,
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </AutomationConditionFilterHOC>
  );
});
