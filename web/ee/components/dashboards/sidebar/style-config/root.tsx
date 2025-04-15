import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
import { ChevronRight } from "lucide-react";
// plane imports
import { EWidgetChartTypes } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { cn } from "@plane/utils";
// local components
import { WidgetConfigSidebarAppearanceConfig } from "./appearance-config";
import { WidgetConfigSidebarGuidesConfig } from "./guides-config";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export const WidgetConfigSidebarStyleConfig: React.FC<Props> = observer((props) => {
  const { handleSubmit } = props;
  // states
  const [isCollapsibleIcon, setIsCollapsibleIcon] = useState(true);
  // translation
  const { t } = useTranslation();
  // form info
  const { getValues, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");

  const handleConfigUpdate = useCallback(
    async (data: Partial<TDashboardWidgetConfig>) => {
      const selectedConfig = getValues("config") ?? {};
      const updatedConfig = {
        ...selectedConfig,
        ...data,
      };

      await handleSubmit({
        config: updatedConfig,
      });
    },
    [handleSubmit]
  );

  return (
    <div className="flex-shrink-0 space-y-3 text-sm">
      <Collapsible
        isOpen={isCollapsibleIcon}
        onToggle={() => setIsCollapsibleIcon((prev) => !prev)}
        title={
          <div className="flex items-center gap-0.5 p-1 -ml-1 hover:bg-custom-background-80 rounded transition-colors">
            <h6 className="font-semibold text-custom-text-200">{t("dashboards.widget.common.style")}</h6>
            <div className="flex-shrink-0 size-4 grid place-items-center">
              <ChevronRight
                className={cn("size-2.5 transition-all", {
                  "rotate-90": isCollapsibleIcon,
                })}
              />
            </div>
          </div>
        }
      >
        <div className="mt-3 flex flex-col gap-y-4">
          <WidgetConfigSidebarAppearanceConfig handleConfigUpdate={handleConfigUpdate} />
          {selectedChartType !== EWidgetChartTypes.NUMBER && (
            <WidgetConfigSidebarGuidesConfig handleConfigUpdate={handleConfigUpdate} />
          )}
        </div>
      </Collapsible>
    </div>
  );
});
