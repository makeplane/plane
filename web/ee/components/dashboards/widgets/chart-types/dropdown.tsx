import { Plus } from "lucide-react";
// plane imports
import { EWidgetChartTypes, WIDGET_CHART_TYPES_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomMenu, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// local components
import { WidgetChartTypeIcon } from "../icon";

type Props = {
  disabled: boolean;
  loading: boolean;
  onClick: (val: EWidgetChartTypes) => void;
};

export const DashboardWidgetChartTypesDropdown: React.FC<Props> = (props) => {
  const { disabled, loading, onClick } = props;
  // translation
  const { t } = useTranslation();

  return (
    <CustomMenu
      customButton={
        <span className={cn(getButtonStyling("neutral-primary", "sm"), "flex items-center gap-1")}>
          {!loading && <Plus className="size-3.5" />}
          {loading ? "Adding" : "Add widget"}
        </span>
      }
      placement="bottom-end"
      disabled={disabled || loading}
      closeOnSelect
      optionsClassName="max-h-[90vh]"
    >
      {WIDGET_CHART_TYPES_LIST.map((chart) => (
        <CustomMenu.MenuItem key={chart.key} onClick={() => onClick(chart.key)} className="flex items-center gap-2">
          <WidgetChartTypeIcon
            type={chart.key}
            className="flex-shrink-0 size-6 text-custom-text-300 transition-colors"
          />
          <span className="text-sm">{t(chart.i18n_short_label)}</span>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
};
