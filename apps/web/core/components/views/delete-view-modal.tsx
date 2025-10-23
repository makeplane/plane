"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
// types
import { PROJECT_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useProjectView } from "@/hooks/store/use-project-view";

type Props = {
  data: IProjectView;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteProjectViewModal: React.FC<Props> = observer((props) => {
  const { data, isOpen, onClose } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  const router = useRouter();
  // store hooks
  const { deleteView } = useProjectView();
  const { t } = useTranslation();
  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeleteView = async () => {
    if (!workspaceSlug || !projectId) return;

    setIsDeleteLoading(true);

    await deleteView(workspaceSlug.toString(), projectId.toString(), data.id)
      .then(() => {
        handleClose();
        router.push(`/${workspaceSlug}/projects/${projectId}/views`);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View deleted successfully.",
        });
        captureSuccess({
          eventName: PROJECT_VIEW_TRACKER_EVENTS.delete,
          payload: {
            view_id: data.id,
          },
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "View could not be deleted. Please try again.",
        });
        captureError({
          eventName: PROJECT_VIEW_TRACKER_EVENTS.delete,
          payload: {
            view_id: data.id,
          },
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeleteView}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title={t("project_views.delete_view.title")}
      content={<>{t("project_views.delete_view.content")}</>}
    />
  );
});
