import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import { AUTOMATION_ACTIVITY_TYPE_OPTIONS, AUTOMATION_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TAutomationActivityType } from "@plane/types";
import { CustomSelect, ToggleSwitch } from "@plane/ui";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarActivityHeaderFilters: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const { activity } = getAutomationById(automationId) ?? {};
  const { filters, updateFilters } = activity ?? {};
  // derived values
  const isShowFailsToggleEnabled = !!filters?.show_fails;
  const activityTypeFilter = filters?.type;
  // translation
  const { t } = useTranslation();

  return (
    <div className="shrink-0 flex items-center gap-2">
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-custom-text-200 text-xs font-medium">{t("automations.activity.filters.show_fails")}</span>
        <ToggleSwitch
          value={isShowFailsToggleEnabled}
          onChange={() => {
            captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.SIDEBAR_ACTIVITY_FILTER });
            updateFilters?.({
              show_fails: !isShowFailsToggleEnabled,
            });
          }}
          className="shrink-0"
        />
      </div>
      <CustomSelect
        value={activityTypeFilter}
        onChange={(value: TAutomationActivityType) => {
          captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.SIDEBAR_ACTIVITY_FILTER });
          updateFilters?.({
            type: value,
          });
        }}
        customButton={
          <button
            type="button"
            className="relative grid place-items-center rounded hover:bg-custom-background-80 p-1 aspect-square transition-colors"
          >
            <ListFilter className="size-3" />
            {activityTypeFilter !== "all" && (
              <span className="absolute size-2 -right-0.5 -top-0.5 bg-custom-primary-100 rounded-full" />
            )}
          </button>
        }
      >
        {AUTOMATION_ACTIVITY_TYPE_OPTIONS.map((item) => (
          <CustomSelect.Option key={item.key} value={item.key}>
            {t(item.i18n_label)}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
});
