"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
// ui
import { PAGE_DELETED } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
import { AlertModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
  editorRef?: React.MutableRefObject<EditorRefApi | null>;
};

export const DeletePageModal: React.FC<TConfirmPageDeletionProps> = observer((props) => {
  const { isOpen, onClose, page, storeType, editorRef } = props;
  const { workspaceSlug } = useParams();
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = usePageStore(storeType);
  const { capturePageEvent } = useEventTracker();
  const router = useRouter();
  if (!page || !page.id) return null;
  // derived values
  const { id: pageId, name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const { pageId: routePageId } = useParams();

  const handleDelete = async () => {
    setIsDeleting(true);
    await removePage({ pageId })
      .then(() => {
        capturePageEvent({
          eventName: PAGE_DELETED,
          payload: {
            ...page,
            state: "SUCCESS",
          },
        });
        editorRef?.current?.findAndDeleteNode(
          { attribute: "entity_identifier", value: page.id ?? "" },
          "pageEmbedComponent"
        );

        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page deleted successfully.",
        });

        if (routePageId) {
          router.back();
        }
      })
      .catch(() => {
        capturePageEvent({
          eventName: PAGE_DELETED,
          payload: {
            ...page,
            state: "FAILED",
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });

    setIsDeleting(false);
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="Delete page"
      content={
        <>
          Are you sure you want to delete page -{" "}
          <span className="break-words font-medium text-custom-text-100 break-all">{getPageName(name)}</span> ? The Page
          will be deleted permanently. This action cannot be undone.
        </>
      }
    />
  );
});
