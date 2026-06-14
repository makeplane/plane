/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { getPageName } from "@plane/utils";
// constants
// gizmo web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const DeletePageModal = observer(function DeletePageModal(props: TConfirmPageDeletionProps) {
  const { isOpen, onClose, page, storeType } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = usePageStore(storeType);

  // derived values
  const { id: pageId, name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const router = useAppRouter();
  const { pageId: routePageId } = useParams();

  const handleDelete = async () => {
    if (!pageId) return;
    setIsDeleting(true);
    await removePage({ pageId })
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Успешно!",
          message: "Страница успешно удалена.",
        });

        if (routePageId) {
          router.back();
        }
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Ошибка!",
          message: "Не удалось удалить страницу. Пожалуйста, попробуйте снова.",
        });
      });

    setIsDeleting(false);
  };

  if (!page || !page.id) return null;

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Удалить страницу"
      content={
        <>
          Вы уверены, что хотите удалить страницу{" "}
          <span className="font-medium break-words break-all text-primary">{getPageName(name)}</span>? Страница будет
          удалена безвозвратно. Это действие нельзя отменить.
        </>
      }
    />
  );
});
