import { observer } from "mobx-react";
// plane imports
import { TNumberWidgetConfig } from "@plane/types";
// local imports
import { TWidgetComponentProps } from ".";

export const DashboardNumberWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { widget } = props;
  // derived values
  const { data, height } = widget ?? {};
  const widgetConfig = widget?.config as TNumberWidgetConfig | undefined;
  const selectedAlignment = widgetConfig?.text_alignment ?? "center";
  const textToDisplay = data?.data?.[0]?.count ?? 0;

  if (!widget) return null;

  return (
    <div className="size-full flex items-center px-4">
      <p
        className="w-full font-semibold text-custom-text-100 truncate transition-all"
        style={{
          fontSize: (height ?? 1) * 1.7 + "rem",
          textAlign: selectedAlignment,
          color: widgetConfig?.text_color,
        }}
      >
        {textToDisplay}
      </p>
    </div>
  );
});
