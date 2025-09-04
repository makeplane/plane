"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// constants
import { WORKSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
// editor
import type { EditorRefApi } from "@plane/editor";
import { EmptyPageIcon } from "@plane/propel/icons";
// ui
import { AlertModalCore, Logo, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { getPageName } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type TConfirmPagesDeleteProps = {
  isOpen: boolean;
  onClose: () => void;
  pages: TPageInstance[];
  storeType: EPageStoreType;
  editorRef?: EditorRefApi | null;
};

export const DeleteMultiplePagesModal: React.FC<TConfirmPagesDeleteProps> = observer((props) => {
  const { isOpen, onClose, pages, storeType, editorRef } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = usePageStore(storeType);

  if (!pages || pages.length === 0) return null;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const successfullyDeletedPageIds: string[] = [];
      const deletePromises = pages.map(async (page) => {
        if (!page.id) return;

        return removePage({ pageId: page.id })
          .then(() => {
            captureSuccess({
              eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_delete,
              payload: {
                ...page,
                state: "SUCCESS",
              },
            });

            // Add to successfully deleted pages
            successfullyDeletedPageIds.push(page.id as string);
          })
          .catch(() => {
            captureError({
              eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_delete,
              payload: {
                ...page,
                state: "FAILED",
              },
            });
          });
      });

      // Wait for all delete operations to complete
      await Promise.all(deletePromises);

      // Bulk delete from editor if applicable
      if (successfullyDeletedPageIds.length > 0 && editorRef) {
        // Pass all IDs at once for a single transaction
        editorRef.findAndDeleteNode(
          { attribute: "entity_identifier", value: successfullyDeletedPageIds },
          "pageEmbedComponent"
        );
      }

      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message:
          successfullyDeletedPageIds.length === 1
            ? "Page deleted successfully."
            : `${successfullyDeletedPageIds.length} pages deleted successfully.`,
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Some pages could not be deleted. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isMultiplePages = pages.length > 1;

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={isMultiplePages ? "Delete pages" : "Delete page"}
      content={
        <div className="space-y-5">
          <p className="text-sm text-custom-text-200">
            {isMultiplePages
              ? "The following pages will be deleted permanently along with their sub pages. This action cannot be undone."
              : "The following page will be deleted permanently. This action cannot be undone."}
          </p>

          <div className="max-h-[120px] overflow-y-auto vertical-scrollbar scrollbar-sm">
            <ul className="text-sm text-custom-text-100 rounded-md border border-custom-border-200 ">
              {pages.map((page) => (
                <li
                  key={page.id}
                  className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 border-custom-border-200 hover:bg-custom-background-80"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 text-custom-text-300">
                    {page.logo_props?.in_use ? (
                      <Logo logo={page.logo_props} size={14} type="lucide" />
                    ) : (
                      <EmptyPageIcon className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-custom-text-100 truncate">{getPageName(page.name)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {isMultiplePages && (
            <p className="text-xs text-custom-text-400 italic">`Total: ${pages.length} pages will be deleted`</p>
          )}
        </div>
      }
    />
  );
});
