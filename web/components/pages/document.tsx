import { FC } from "react";
import { Sparkle } from "lucide-react";
// components
import { GptAssistantPopover } from "components/core";
// hooks
import useToast from "hooks/use-toast";
import { usePage, useProjectPages } from "hooks/store";

export type PageDocumentProps = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
};

export const PageDocument: FC<PageDocumentProps> = (props) => {
  const { workspaceSlug, projectId, pageId } = props;
  // hooks
  const { setToastAlert } = useToast();
  const {
    archivePage: archivePageAction,
    restorePage: restorePageAction,
    createPage: createPageAction,
    projectPageMap,
    projectArchivedPageMap,
    fetchProjectPages,
    fetchArchivedProjectPages,
    cleanup,
  } = useProjectPages();
  const pageStore = usePage(pageId);
  const {
    lockPage: lockPageAction,
    unlockPage: unlockPageAction,
    updateName: updateNameAction,
    updateDescription: updateDescriptionAction,
    id: pageIdMobx,
    isSubmitting,
    setIsSubmitting,
    owned_by,
    is_locked,
    archived_at,
    created_at,
    created_by,
    updated_at,
    updated_by,
  } = pageStore;

  const archivePage = async (workspaceSlug: string, projectId: string, pageId: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await archivePageAction(workspaceSlug as string, projectId as string, pageId as string);
    } catch (error) {
      setToastAlert({
        title: `Page could not be archived`,
        message: `Sorry, page could not be archived, please try again later`,
        type: "error",
      });
    }
  };

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

  const lockPage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await lockPageAction();
    } catch (error) {
      setToastAlert({
        title: `Page could not be locked`,
        message: `Sorry, page could not be locked, please try again later`,
        type: "error",
      });
    }
  };

  const unlockPage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await unlockPageAction();
    } catch (error) {
      setToastAlert({
        title: `Page could not be unlocked`,
        message: `Sorry, page could not be unlocked, please try again later`,
        type: "error",
      });
    }
  };
  return (
    <div className="relative h-full w-full overflow-hidden">
      <DocumentEditorWithRef
        isSubmitting={isSubmitting}
        documentDetails={{
          title: pageTitle,
          created_by: created_by,
          created_on: created_at,
          last_updated_at: updated_at,
          last_updated_by: updated_by,
        }}
        uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
        deleteFile={fileService.getDeleteImageFunction(workspaceId)}
        restoreFile={fileService.getRestoreImageFunction(workspaceId)}
        value={pageDescription}
        setShouldShowAlert={setShowAlert}
        cancelUploadImage={fileService.cancelUpload}
        ref={editorRef}
        debouncedUpdatesEnabled={false}
        setIsSubmitting={setIsSubmitting}
        updatePageTitle={updatePageTitle}
        onActionCompleteHandler={actionCompleteAlert}
        customClassName="tracking-tight self-center h-full w-full right-[0.675rem]"
        onChange={(_description_json: Object, description_html: string) => {
          setShowAlert(true);
          onChange(description_html);
          handleSubmit(updatePage)();
        }}
        duplicationConfig={userCanDuplicate ? { action: duplicate_page } : undefined}
        pageArchiveConfig={
          userCanArchive
            ? {
                is_archived: archived_at ? true : false,
                action: archived_at ? unArchivePage : archivePage,
              }
            : undefined
        }
        pageLockConfig={userCanLock ? { is_locked: false, action: lockPage } : undefined}
      />
      {projectId && envConfig?.has_openai_configured && (
        <div className="absolute right-[68px] top-2.5">
          <GptAssistantPopover
            isOpen={gptModalOpen}
            projectId={projectId.toString()}
            handleClose={() => {
              setGptModal((prevData) => !prevData);
              // this is done so that the title do not reset after gpt popover closed
              reset(getValues());
            }}
            onResponse={(response) => {
              handleAiAssistance(response);
            }}
            placement="top-end"
            button={
              <button
                type="button"
                className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90"
                onClick={() => setGptModal((prevData) => !prevData)}
              >
                <Sparkle className="h-4 w-4" />
                AI
              </button>
            }
            className="!min-w-[38rem]"
          />
        </div>
      )}
    </div>
  );
};
