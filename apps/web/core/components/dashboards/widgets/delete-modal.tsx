/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane imports
import { AlertModalCore } from "@plane/ui";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

type Props = {
  dashboardId: string;
  handleClose: () => void;
  isOpen: boolean;
  widgetId: string | null;
};

export const DashboardWidgetDeleteModal = observer(function DashboardWidgetDeleteModal(props: Props) {
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
          <span className="break-words font-medium text-primary">{widgetDetails?.name}</span>
          {'"'}? This action cannot be undone.
        </>
      }
    />
  );
});
