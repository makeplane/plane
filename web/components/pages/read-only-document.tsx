import { FC, useRef } from "react";
// ui
import { DocumentEditorWithRef, DocumentReadOnlyEditorWithRef } from "@plane/document-editor";
import useToast from "hooks/use-toast";

export type PageReadOnlyDocumentProps = {
  title: string;
  description: string | undefined;
  created_by: string;
};

export const PageReadOnlyDocument: FC<PageReadOnlyDocumentProps> = (props) => {
  const {
    title,
    description = "",
    created_by,
    created_at,
    updated_at,
    updated_by,
    userCanLock,
    archived_at,
    unlockPage,
    canArchive,
    canDuplicate,
  } = props;
  // refs
  const editorRef = useRef<any>(null);
  // hooks
  const { setToastAlert } = useToast();

  const unArchivePage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await restorePageAction(workspaceSlug as string, projectId as string, pageId as string);
    } catch (error) {
      setToastAlert({
        title: `Page could not be restored`,
        message: `Sorry, page could not be restored, please try again later`,
        type: "error",
      });
    }
  };

  const duplicate_page = async () => {
    const currentPageValues = getValues();

    if (!currentPageValues?.description_html) {
      // TODO: We need to get latest data the above variable will give us stale data
      currentPageValues.description_html = pageDescription as string;
    }

    const formData: Partial<IPage> = {
      name: "Copy of " + pageTitle,
      description_html: currentPageValues.description_html,
    };

    try {
      await createPage(formData);
    } catch (error) {
      actionCompleteAlert({
        title: `Page could not be duplicated`,
        message: `Sorry, page could not be duplicated, please try again later`,
        type: "error",
      });
    }
  };

  return (
    <DocumentReadOnlyEditorWithRef
      onActionCompleteHandler={setToastAlert}
      ref={editorRef}
      value={description}
      customClassName={"tracking-tight w-full px-0"}
      borderOnFocus={false}
      noBorder
      documentDetails={{
        title: title,
        created_by: created_by,
        created_on: created_at,
        last_updated_at: updated_at,
        last_updated_by: updated_by,
      }}
      pageLockConfig={userCanLock && !archived_at ? { action: unlockPage, is_locked: is_locked } : undefined}
      pageDuplicationConfig={canDuplicate && !archived_at ? { action: duplicate_page } : undefined}
      pageArchiveConfig={
        canArchive
          ? {
              action: archived_at ? unArchivePage : archivePage,
              is_archived: archived_at ? true : false,
              archived_at: archived_at ? new Date(archived_at) : undefined,
            }
          : undefined
      }
    />
  );
};
