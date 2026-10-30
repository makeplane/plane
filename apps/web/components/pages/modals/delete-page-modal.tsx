/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { setToast } from "@plane/blocks/toast";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { getPageName } from "@plane/utils";
// constants
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import type { EPageStoreType } from "@/hooks/store";
import { usePageStore } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const DeletePageModal = observer(function DeletePageModal(props: TConfirmPageDeletionProps) {
  const { t } = useTranslation();

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
    try {
      await removePage({ pageId });
      handleClose();
      setToast({
        type: "success",
        title: t("success"),
        message: t("web_ui.page_deleted_successfully"),
      });

      if (routePageId) {
        router.back();
      }
    } catch {
      setToast({
        type: "error",
        title: t("error"),
        message: t("web_ui.page_could_not_be_deleted_please_try_again"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!page || !page.id) return null;

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("web_ui.delete_page")}
      content={
        <>
          {t("web_ui.are_you_sure_you_want_to_delete_page")}{" "}
          <span className="font-medium break-words break-all text-primary">{getPageName(name)}</span>{" "}
          {t("web_ui.the_page_will_be_deleted_permanently_this_action_cannot_be_undone")}{" "}
        </>
      }
    />
  );
});
