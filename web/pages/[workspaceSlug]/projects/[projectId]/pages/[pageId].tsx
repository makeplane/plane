import React, { useEffect, useRef, useState, ReactElement, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR, { MutatorOptions } from "swr";
import { Controller, useForm } from "react-hook-form";
import { Sparkle } from "lucide-react";
import debounce from "lodash/debounce";
// hooks
import { useApplication, useIssues, usePage, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
import useReloadConfirmations from "hooks/use-reload-confirmation";
// services
import { PageService } from "services/page.service";
import { FileService } from "services/file.service";
import { IssueService } from "services/issue";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GptAssistantPopover } from "components/core";
import { PageDetailsHeader } from "components/headers/page-details";
import { EmptyState } from "components/common";
// ui
import { DocumentEditorWithRef, DocumentReadOnlyEditorWithRef } from "@plane/document-editor";
import { Spinner } from "@plane/ui";
// assets
import emptyPage from "public/empty-state/page.svg";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { NextPageWithLayout } from "lib/types";
import { IPage, TIssue } from "@plane/types";
// fetch-keys
import { PAGE_DETAILS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// constants
import { EUserProjectRoles } from "constants/project";
import { useIssueEmbeds } from "hooks/use-issue-embeds";
import { useProjectPages } from "hooks/store/use-project-specific-pages";

// services
const fileService = new FileService();

const PageDetailsPage: NextPageWithLayout = observer(() => {
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const [gptModalOpen, setGptModal] = useState(false);
  // refs
  const editorRef = useRef<any>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;
  // store hooks
  const {
    config: { envConfig },
  } = useApplication();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  // toast alert
  const { setToastAlert } = useToast();
  const { setShowAlert } = useReloadConfirmations();

  const { handleSubmit, setValue, watch, getValues, control, reset } = useForm<IPage>({
    defaultValues: { name: "", description_html: "" },
  });

  const { issues, fetchIssue, issueWidgetClickAction } = useIssueEmbeds();
  const { archivePage: archivePageMobx, restorePage: restorePageMobx, createPage: createPageMobx } = useProjectPages();
  const pageStore = usePage(pageId as string);

  // We need to get the values of title and description from the page store but we don't have to subscribe to those values
  const pageTitle = pageStore?.name;
  const pageDescription = pageStore?.description_html;
  const {
    lockPage: lockPageMobx,
    unlockPage: unlockPageMobx,
    updateName: updateNameMobx,
    updateDescription: updateDescriptionMobx,
    id: pageIdMobx,
    owned_by,
    is_locked,
    archived_at,
    created_at,
    created_by,
    updated_at,
    updated_by,
  } = pageStore;

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    const newDescription = `${watch("description_html")}<p>${response}</p>`;
    setValue("description_html", newDescription);
    editorRef.current?.setEditorValue(newDescription);
    updateDescriptionMobx(newDescription);
  };

  const actionCompleteAlert = ({
    title,
    message,
    type,
  }: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }) => {
    setToastAlert({
      title,
      message,
      type,
    });
  };

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert]);

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    formData.name = pageTitle as string;

    if (!formData?.name || formData?.name.length === 0) return;

    try {
      await updateDescriptionMobx(formData.description_html);
      await updateNameMobx(formData.name);
    } catch (error) {
      actionCompleteAlert({
        title: `Page could not be updated`,
        message: `Sorry, page could not be updated, please try again later`,
        type: "error",
      });
    }
  };

  const updatePageTitle = async (title: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;
    await updateNameMobx(title);
  };

  const createPage = async (payload: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;
    await createPageMobx(workspaceSlug as string, projectId as string, payload);
  };

  // ================ Page Menu Actions ==================
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

  const archivePage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await archivePageMobx(workspaceSlug as string, projectId as string, pageId as string);
    } catch (error) {
      actionCompleteAlert({
        title: `Page could not be archived`,
        message: `Sorry, page could not be archived, please try again later`,
        type: "error",
      });
    }
  };

  const unArchivePage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await restorePageMobx(workspaceSlug as string, projectId as string, pageId as string);
    } catch (error) {
      actionCompleteAlert({
        title: `Page could not be restored`,
        message: `Sorry, page could not be restored, please try again later`,
        type: "error",
      });
    }
  };

  // ========================= Page Lock ==========================
  const lockPage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await lockPageMobx();
    } catch (error) {
      actionCompleteAlert({
        title: `Page could not be locked`,
        message: `Sorry, page could not be locked, please try again later`,
        type: "error",
      });
    }
  };

  const unlockPage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    try {
      await unlockPageMobx();
    } catch (error) {
      actionCompleteAlert({
        title: `Page could not be unlocked`,
        message: `Sorry, page could not be unlocked, please try again later`,
        type: "error",
      });
    }
  };

  const [localPageDescription, setLocalIssueDescription] = useState({
    id: pageId as string,
    description_html: pageDescription as string,
  });

  // ADDING updatePage TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(updatePage)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit]
  );

  const isPageReadOnly =
    is_locked ||
    archived_at ||
    (currentProjectRole && [EUserProjectRoles.VIEWER, EUserProjectRoles.GUEST].includes(currentProjectRole));

  const isCurrentUserOwner = owned_by === currentUser?.id;

  const userCanDuplicate =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);
  const userCanArchive = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const userCanLock =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <>
      {pageIdMobx && issues ? (
        <div className="flex h-full flex-col justify-between">
          <div className="h-full w-full overflow-hidden">
            {isPageReadOnly ? (
              <DocumentReadOnlyEditorWithRef
                onActionCompleteHandler={actionCompleteAlert}
                ref={editorRef}
                value={localPageDescription.description_html}
                rerenderOnPropsChange={localPageDescription}
                customClassName={"tracking-tight w-full px-0"}
                borderOnFocus={false}
                noBorder
                documentDetails={{
                  title: pageTitle,
                  created_by: created_by,
                  created_on: created_at,
                  last_updated_at: updated_at,
                  last_updated_by: updated_by,
                }}
                pageLockConfig={userCanLock && !archived_at ? { action: unlockPage, is_locked: is_locked } : undefined}
                pageDuplicationConfig={userCanDuplicate && !archived_at ? { action: duplicate_page } : undefined}
                pageArchiveConfig={
                  userCanArchive
                    ? {
                        action: archived_at ? unArchivePage : archivePage,
                        is_archived: archived_at ? true : false,
                        archived_at: archived_at ? new Date(archived_at) : undefined,
                      }
                    : undefined
                }
                embedConfig={{
                  issueEmbedConfig: {
                    issues: issues,
                    fetchIssue: fetchIssue,
                    clickAction: issueWidgetClickAction,
                  },
                }}
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden">
                <Controller
                  name="description_html"
                  control={control}
                  render={({ field: { onChange } }) => (
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
                      setShouldShowAlert={setShowAlert}
                      deleteFile={fileService.deleteImage}
                      restoreFile={fileService.restoreImage}
                      cancelUploadImage={fileService.cancelUpload}
                      ref={editorRef}
                      debouncedUpdatesEnabled={false}
                      setIsSubmitting={setIsSubmitting}
                      updatePageTitle={updatePageTitle}
                      value={localPageDescription.description_html}
                      rerenderOnPropsChange={localPageDescription}
                      onActionCompleteHandler={actionCompleteAlert}
                      customClassName="tracking-tight self-center px-0 h-full w-full"
                      onChange={(_description_json: Object, description_html: string) => {
                        setShowAlert(true);
                        onChange(description_html);
                        setIsSubmitting("submitting");
                        debouncedFormSave();
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
                      embedConfig={{
                        issueEmbedConfig: {
                          issues: issues,
                          fetchIssue: fetchIssue,
                          clickAction: issueWidgetClickAction,
                        },
                      }}
                    />
                  )}
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
            )}
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Spinner />
        </div>
      )}
    </>
  );
});

PageDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PageDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default PageDetailsPage;
