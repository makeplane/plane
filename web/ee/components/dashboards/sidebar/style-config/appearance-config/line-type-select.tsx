// plane imports
import { LINE_CHART_LINE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TWidgetLineChartLineType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local imports
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetConfigSelectButton } from "../../select-button";

type Props = {
  onChange: (value: TWidgetLineChartLineType) => void;
  value: TWidgetLineChartLineType | undefined;
};

export const WidgetLineTypeSelect: React.FC<Props> = (props) => {
  const { onChange, value } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const selectedLineType = LINE_CHART_LINE_TYPES.find((p) => p.key === value);

  return (
    <WidgetPropertyWrapper
      title={t("dashboards.widget.chart_types.line_chart.line_type.label")}
      input={
        <CustomSelect
          customButton={
            <WidgetConfigSelectButton
              placeholder={t("dashboards.widget.chart_types.line_chart.line_type.placeholder")}
              title={t(selectedLineType?.i18n_label ?? "")}
              value={!!selectedLineType}
            />
          }
          customButtonClassName="w-full"
          value={value}
          onChange={onChange}
        >
          {LINE_CHART_LINE_TYPES.map((type) => (
            <CustomSelect.Option key={type.key} value={type.key}>
              {t(type.i18n_label)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      }
    />
  );
};
