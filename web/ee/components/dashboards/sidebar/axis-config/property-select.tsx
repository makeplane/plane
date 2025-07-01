// plane imports
import { WIDGET_X_AXIS_PROPERTIES_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EWidgetXAxisProperty, TDashboardWidget } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// local components
import { WidgetPropertyWrapper } from "../property-wrapper";
import { WidgetConfigSelectButton } from "../select-button";

type Props = {
  onChange: (value: EWidgetXAxisProperty) => void;
  placeholder: string;
  title: string;
  value: TDashboardWidget["x_axis_property"];
};

export const WidgetPropertySelect: React.FC<Props> = (props) => {
  const { onChange, placeholder, title, value } = props;
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
              title={t(value ? WIDGET_X_AXIS_PROPERTIES_LIST[value]?.i18n_label : "")}
              value={!!value}
            />
          }
          customButtonClassName="w-full"
          value={value}
          onChange={onChange}
        >
          {Object.entries(WIDGET_X_AXIS_PROPERTIES_LIST).map(([key, property]) => (
            <CustomSelect.Option key={key} value={key}>
              {t(property.i18n_label)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      }
    />
  );
};
