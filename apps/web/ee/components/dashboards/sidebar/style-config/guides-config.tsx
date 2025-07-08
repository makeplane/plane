import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../property-wrapper";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export const WidgetConfigSidebarGuidesConfig: React.FC<Props> = (props) => {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <div className="flex-shrink-0 space-y-1 text-sm">
      <h6 className="font-medium text-custom-text-200">{t("dashboards.widget.common.guides")}</h6>
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.legends")}
        input={
          <Controller
            control={control}
            name="config.show_legends"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <ToggleSwitch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_legends: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.tooltips")}
        input={
          <Controller
            control={control}
            name="config.show_tooltip"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <ToggleSwitch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_tooltip: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
    </div>
  );
};
