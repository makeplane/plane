// plane imports
import { EWidgetChartTypes, WIDGET_CHART_TYPES_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local components
import { WidgetChartTypeIcon } from "../../widgets";

type Props = {
  onChange: (key: EWidgetChartTypes) => void;
  value: EWidgetChartTypes | undefined;
};

export const WidgetConfigSidebarChartTypesList: React.FC<Props> = (props) => {
  const { onChange, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 space-y-3">
      <h6 className="text-sm font-medium text-custom-text-200">{t("dashboards.widget.common.chart_type")}</h6>
      <div className="grid grid-cols-6 gap-3">
        {WIDGET_CHART_TYPES_LIST.map((chart) => {
          const isTypeSelected = value === chart.key;

          return (
            <button
              key={chart.key}
              type="button"
              onClick={() => onChange(chart.key)}
              className={cn("group space-y-2", {
                "pointer-events-none": isTypeSelected,
              })}
            >
              <div
                className={cn(
                  "rounded border border-custom-border-300 grid place-items-center aspect-square transition-colors",
                  {
                    "border-custom-primary-100": isTypeSelected,
                    "group-hover:bg-custom-background-80": !isTypeSelected,
                  }
                )}
              >
                <WidgetChartTypeIcon
                  type={chart.key}
                  className={cn("flex-shrink-0 size-6 text-custom-text-400 transition-colors", {
                    "text-custom-primary-100": isTypeSelected,
                  })}
                />
              </div>
              <p className="text-sm font-medium text-custom-text-300 text-center">{t(chart.i18n_short_label)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
