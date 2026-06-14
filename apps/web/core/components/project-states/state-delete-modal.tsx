/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Gizmo imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IState } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type TStateDeleteModal = {
  isOpen: boolean;
  onClose: () => void;
  data: IState | null;
};

export const StateDeleteModal = observer(function StateDeleteModal(props: TStateDeleteModal) {
  const { isOpen, onClose, data } = props;
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  const { deleteState } = useProjectState();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    await deleteState(workspaceSlug.toString(), data.project_id, data.id)
      .then(() => {
        handleClose();
      })
      .catch((err) => {
        if (err.status === 400)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Ошибка!",
            message:
              "Это состояние содержит рабочие элементы. Переместите их в другое состояние, чтобы удалить это состояние.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Ошибка!",
            message: "Не удалось удалить состояние. Пожалуйста, попробуйте снова.",
          });
      })
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Удалить состояние"
      content={
        <>
          Вы уверены, что хотите удалить состояние <span className="font-medium text-primary">{data?.name}</span>? Все
          связанные с этим состоянием данные будут безвозвратно удалены. Это действие нельзя отменить.
        </>
      }
    />
  );
});
