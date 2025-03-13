"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

type Props = {
  dashboardId: string;
  handleClose: () => void;
  handleDelete: () => Promise<void>;
  isOpen: boolean;
};

export const DashboardDeleteModal: React.FC<Props> = observer((props) => {
  const { dashboardId, handleClose, handleDelete, isOpen } = props;
  // states
  const [loader, setLoader] = useState(false);
  // store hooks
  const { getDashboardById } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  // translation
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      setLoader(true);
      await handleDelete();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Dashboard deleted successfully.",
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
      title={t("dashboards.delete_modal.heading")}
      content={
        <>
          Are you sure you want to delete dashboard{' "'}
          <span className="break-words font-medium text-custom-text-100">{dashboardDetails?.name}</span>
          {'"'}? All of the data related to the dashboard will be permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
