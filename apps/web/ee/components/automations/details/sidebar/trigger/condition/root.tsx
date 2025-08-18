import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TAutomationConditionFilterExpression } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { AddFilterButton } from "@/plane-web/components/rich-filters/add-filters-button";
import { FilterItem } from "@/plane-web/components/rich-filters/filter-item";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationConditionFilterHOC } from "./filter-provider";

type Props = {
  automationId: string;
  initialFilterExpression: TAutomationConditionFilterExpression | undefined;
  updateFilterExpression: (updatedFilters: TAutomationConditionFilterExpression) => void;
};

export const AutomationDetailsSidebarTriggerConditionRoot: React.FC<Props> = observer((props) => {
  const { automationId, initialFilterExpression, updateFilterExpression } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);

  if (!automation) return null;

  return (
    <AutomationConditionFilterHOC
      projectId={automation.project}
      workspaceSlug={automation.workspaceSlug}
      initialFilterExpression={initialFilterExpression}
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
