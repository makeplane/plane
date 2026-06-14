/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IIssueLabel } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useLabel } from "@/hooks/store/use-label";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IIssueLabel | null;
};

export const DeleteLabelModal = observer(function DeleteLabelModal(props: Props) {
  const { isOpen, onClose, data } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { deleteLabel } = useLabel();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !projectId || !data) return;

    setIsDeleteLoading(true);

    await deleteLabel(workspaceSlug.toString(), projectId.toString(), data.id)
      .then(() => {
        handleClose();
      })
      .catch((err) => {
        setIsDeleteLoading(false);
        const error = err?.error || "Не удалось удалить метку. Пожалуйста, попробуйте снова.";
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Ошибка!",
          message: error,
        });
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Удалить метку"
      content={
        <>
          Вы уверены, что хотите удалить <span className="font-medium text-primary">{data?.name}</span>? Метка будет
          убрана со всех рабочих элементов и из всех представлений, где она используется в фильтрах.
        </>
      }
    />
  );
});
