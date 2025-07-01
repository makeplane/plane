// plane imports
import { ALL_WIDGETS_Y_AXIS_METRICS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EWidgetYAxisMetric, TDashboardWidget } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../property-wrapper";
import { WidgetConfigSelectButton } from "../select-button";

type Props = {
  onChange: (value: EWidgetYAxisMetric) => void;
  options: EWidgetYAxisMetric[];
  placeholder: string;
  title: string;
  value: TDashboardWidget["y_axis_metric"];
};

export const WidgetMetricSelect: React.FC<Props> = (props) => {
  const { onChange, options, placeholder, title, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <WidgetPropertyWrapper
      title={title}
      input={
        <CustomSelect
          customButton={
            <WidgetConfigSelectButton
              placeholder={placeholder}
              title={t(value ? ALL_WIDGETS_Y_AXIS_METRICS_LIST[value]?.i18n_label : "")}
              value={!!value}
            />
          }
          customButtonClassName="w-full"
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <CustomSelect.Option key={option} value={option}>
              {t(ALL_WIDGETS_Y_AXIS_METRICS_LIST[option].i18n_label)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      }
    />
  );
};
