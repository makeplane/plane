import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { TDashboardWidget } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { WidgetConfigSidebarAxisConfig } from "./axis-config";
import { WidgetConfigSidebarBasicConfig } from "./basic-config";
import { WidgetConfigSidebarHeader } from "./header";
import { WidgetConfigSidebarStyleConfig } from "./style-config/root";

type Props = {
  className?: string;
  dashboardId: string;
};

export const DashboardsWidgetConfigSidebarRoot: React.FC<Props> = observer((props) => {
  const { className, dashboardId } = props;
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  // derived values
  const { isViewModeEnabled } = dashboardDetails ?? {};
  const {
    isEditingWidget: widgetIdToEdit,
    getWidgetById,
    toggleEditWidget,
    toggleDeleteWidget,
  } = dashboardDetails?.widgetsStore ?? {};
  const isEditingWidget = !!widgetIdToEdit;
  const widget = widgetIdToEdit ? getWidgetById?.(widgetIdToEdit) : undefined;
  const { asJSON, id, isConfigurationMissing, fetchWidgetData, updateWidget } = widget ?? {};
  const shouldShowSidebar = !isViewModeEnabled && !!widgetIdToEdit;
  // form info
  const methods = useForm<TDashboardWidget>();
  const { handleSubmit, reset } = methods;

  const handleCloseSidebar = useCallback(() => {
    toggleEditWidget?.(null);
  }, [toggleEditWidget]);

  const handleFormSubmit = useCallback(
    async (data: Partial<TDashboardWidget>) => {
      try {
        await updateWidget?.(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { config, ...rest } = data;
        if (!isConfigurationMissing && Object.keys(rest).length) {
          fetchWidgetData?.();
        }
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      }
    },
    [fetchWidgetData, isConfigurationMissing, updateWidget]
  );

  const handleDelete = useCallback(() => {
    if (!id) return;
    toggleDeleteWidget?.(id);
  }, [id, toggleDeleteWidget]);

  useEffect(() => {
    if (!isEditingWidget || !asJSON) return;
    reset({
      ...asJSON,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asJSON, isEditingWidget]);

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn(className, "w-[308px] -mr-[308px] flex flex-col gap-y-4 transition-all", {
        "mr-0": shouldShowSidebar,
      })}
    >
      <FormProvider {...methods}>
        <WidgetConfigSidebarHeader handleClose={handleCloseSidebar} handleDelete={handleDelete} />
        <WidgetConfigSidebarBasicConfig handleSubmit={handleFormSubmit} />
        <div className="flex-shrink-0 h-px bg-custom-background-80" />
        <WidgetConfigSidebarAxisConfig handleSubmit={handleFormSubmit} />
        <div className="flex-shrink-0 h-px bg-custom-background-80" />
        <WidgetConfigSidebarStyleConfig handleSubmit={handleFormSubmit} />
      </FormProvider>
    </form>
  );
});
