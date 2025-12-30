import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
// types
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useProjectView } from "@/hooks/store/use-project-view";

type Props = {
  data: IProjectView;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteProjectViewModal = observer(function DeleteProjectViewModal(props: Props) {
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
    try {
      setIsDeleteLoading(true);
      await deleteView(workspaceSlug.toString(), projectId.toString(), data.id);
      handleClose();
      router.push(`/${workspaceSlug}/projects/${projectId}/views`);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "View deleted successfully.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "View could not be deleted. Please try again.",
      });
    }
    setIsDeleteLoading(false);
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
