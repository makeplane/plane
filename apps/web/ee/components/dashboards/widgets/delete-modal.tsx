"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

type Props = {
  dashboardId: string;
  handleClose: () => void;
  isOpen: boolean;
  widgetId: string | null;
};

export const DashboardWidgetDeleteModal: React.FC<Props> = observer((props) => {
  const { dashboardId, handleClose, isOpen, widgetId } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { widgetsStore } = dashboardDetails ?? {};
  const { isEditingWidget, deleteWidget, getWidgetById, toggleEditWidget } = widgetsStore ?? {};
  const widgetDetails = widgetId ? getWidgetById?.(widgetId) : null;

  const handleSubmit = async () => {
    if (!widgetDetails?.id) return;

    try {
      setLoader(true);
      await deleteWidget?.(widgetDetails.id);
      if (isEditingWidget === widgetId) {
        toggleEditWidget?.(null);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Widget deleted successfully.",
      });
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Warning!",
        message: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete widget"
      content={
        <>
          Are you sure you want to delete widget{' "'}
          <span className="break-words font-medium text-custom-text-100">{widgetDetails?.name}</span>
          {'"'}? This action cannot be undone.
        </>
      }
    />
  );
});
