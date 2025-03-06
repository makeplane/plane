import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { TTextWidgetConfig } from "@plane/types";
// local components
import { DashboardWidgetHeader } from "../header";
import { commonWidgetClassName, TWidgetComponentProps, WIDGET_HEADER_HEIGHT, WIDGET_Y_SPACING } from ".";

export const DashboardTextWidget: React.FC<TWidgetComponentProps> = observer((props) => {
  const { dashboardId, isSelected, widget } = props;
  // refs
  const widgetRef = useRef<HTMLDivElement>(null);
  // derived values
  const { data, height } = widget ?? {};
  const widgetConfig = widget?.config as TTextWidgetConfig | undefined;
  const selectedAlignment = widgetConfig?.text_alignment ?? "center";
  const textToDisplay = data?.data?.[0]?.count ?? 0;

  if (!widget) return null;

  return (
    <div
      ref={widgetRef}
      className={commonWidgetClassName({
        isSelected,
      })}
    >
      <DashboardWidgetHeader dashboardId={dashboardId} widget={widget} widgetRef={widgetRef} />
      <div
        className="flex items-center px-4"
        style={{
          height: `calc(100% - ${WIDGET_HEADER_HEIGHT + WIDGET_Y_SPACING}px)`,
        }}
      >
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
    </div>
  );
});
