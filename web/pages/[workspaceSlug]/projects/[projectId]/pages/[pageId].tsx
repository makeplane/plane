import React, { useEffect, useRef, useState, ReactElement, useCallback } from "react";
import { useRouter } from "next/router";
import useSWR, { MutatorOptions } from "swr";
import { Controller, useForm } from "react-hook-form";
// services
import { PageService } from "services/page.service";
import { FileService } from "services/file.service";
// hooks
import useUser from "hooks/use-user";
import debounce from "lodash/debounce";
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PageDetailsHeader } from "components/headers/page-details";
import { EmptyState } from "components/common";
// ui
import { DocumentEditorWithRef, DocumentReadOnlyEditorWithRef } from "@plane/document-editor";
import { Spinner } from "@plane/ui";
// assets
import emptyPage from "public/empty-state/page.svg";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { NextPageWithLayout } from "types/app";
import { IPage, IIssue } from "types";
// fetch-keys
import { PAGE_DETAILS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";
import { IssuePeekOverview } from "components/issues/peek-overview";
import { IssueService } from "services/issue";
import useToast from "hooks/use-toast";
import useReloadConfirmations from "hooks/use-reload-confirmation";
import { EUserWorkspaceRoles } from "constants/workspace";
import { GptAssistantModal } from "components/core";
import { Sparkle } from "lucide-react";
import { observer } from "mobx-react-lite";

// services
const fileService = new FileService();
const pageService = new PageService();
const issueService = new IssueService();

const PageDetailsPage: NextPageWithLayout = observer(() => {
  const {
    projectIssues: { updateIssue },
    appConfig: { envConfig },
    user: { currentProjectRole },
  } = useMobxStore();

  const editorRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  const [gptModalOpen, setGptModal] = useState(false);

  const { setShowAlert } = useReloadConfirmations();
  const router = useRouter();
  const { workspaceSlug, projectId, pageId, peekIssueId } = router.query;
  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { handleSubmit, setValue, watch, getValues, control } = useForm<IPage>({
    defaultValues: { name: "", description_html: "" },
  });

  const { data: issuesResponse } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string) : null,
    workspaceSlug && projectId ? () => issueService.getIssues(workspaceSlug as string, projectId as string) : null
  );

  const issues = Object.values(issuesResponse ?? {});

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    const newDescription = `${watch("description_html")}<p>${response}</p>`;
    setValue("description_html", newDescription);
    editorRef.current?.setEditorValue(newDescription);

    pageService
      .patchPage(workspaceSlug.toString(), projectId.toString(), pageId.toString(), {
        description_html: newDescription,
      })
      .then(() => {
        mutatePageDetails((prevData) => ({ ...prevData, description_html: newDescription } as IPage), false);
      });
  };

  // =================== Fetching Page Details ======================
  const {
    data: pageDetails,
    mutate: mutatePageDetails,
    error,
  } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_DETAILS(pageId.toString()) : null,
    workspaceSlug && projectId && pageId
      ? () => pageService.getPageDetails(workspaceSlug.toString(), projectId.toString(), pageId.toString())
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  const handleUpdateIssue = (issueId: string, data: Partial<IIssue>) => {
    if (!workspaceSlug || !projectId || !user) return;

    updateIssue(workspaceSlug.toString(), projectId.toString(), issueId, data);
  };

  const fetchIssue = async (issueId: string) => {
    const issue = await issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string);
    return issue as IIssue;
  };

  const issueWidgetClickAction = (issueId: string) => {
    const url = new URL(router.asPath, window.location.origin);
    const params = new URLSearchParams(url.search);

    if (params.has("peekIssueId")) {
      params.set("peekIssueId", issueId);
    } else {
      params.append("peekIssueId", issueId);
    }
    // Replace the current URL with the new one
    router.replace(`${url.pathname}?${params.toString()}`, undefined, { shallow: true });
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

  // adding pageDetails.description_html to dependency array causes
  // editor rerendering on every save
  useEffect(() => {
    if (pageDetails?.description_html) {
      setLocalIssueDescription({ id: pageId as string, description_html: pageDetails.description_html });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageDetails?.description_html]); // TODO: Verify the exhaustive-deps warning

  function createObjectFromArray(keys: string[], options: any): any {
    return keys.reduce((obj, key) => {
      if (options[key] !== undefined) {
        obj[key] = options[key];
      }
      return obj;
    }, {} as { [key: string]: any });
  }

  const mutatePageDetailsHelper = (
    serverMutatorFn: Promise<any>,
    dataToMutate: Partial<IPage>,
    formDataValues: Array<keyof IPage>,
    onErrorAction: () => void
  ) => {
    const commonSwrOptions: MutatorOptions = {
      revalidate: true,
      populateCache: false,
      rollbackOnError: () => {
        onErrorAction();
        return true;
      },
    };
    const formData = getValues();
    const formDataMutationObject = createObjectFromArray(formDataValues, formData);

    mutatePageDetails(async () => serverMutatorFn, {
      optimisticData: (prevData) => {
        if (!prevData) return;
        return {
          ...prevData,
          description_html: formData["description_html"],
          ...formDataMutationObject,
          ...dataToMutate,
        };
      },
      ...commonSwrOptions,
    });
  };

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    formData.name = pageDetails?.name as string;

    if (!formData?.name || formData?.name.length === 0) return;

    try {
      await pageService.patchPage(workspaceSlug.toString(), projectId.toString(), pageId.toString(), formData);
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

    mutatePageDetailsHelper(
      pageService.patchPage(workspaceSlug.toString(), projectId.toString(), pageId.toString(), { name: title }),
      {
        name: title,
      },
      [],
      () =>
        actionCompleteAlert({
          title: `Page Title could not be updated`,
          message: `Sorry, page title could not be updated, please try again later`,
          type: "error",
        })
    );
  };

  const createPage = async (payload: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;

    await pageService.createPage(workspaceSlug.toString(), projectId.toString(), payload);
  };

  // ================ Page Menu Actions ==================
  const duplicate_page = async () => {
    const currentPageValues = getValues();

    if (!currentPageValues?.description_html) {
      currentPageValues.description_html = pageDetails?.description_html as string;
    }

    const formData: Partial<IPage> = {
      name: "Copy of " + pageDetails?.name,
      description_html: currentPageValues.description_html,
    };
    await createPage(formData);
  };

  const archivePage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    mutatePageDetailsHelper(
      pageService.archivePage(workspaceSlug.toString(), projectId.toString(), pageId.toString()),
      {
        archived_at: renderDateFormat(new Date()),
      },
      ["description_html"],
      () =>
        actionCompleteAlert({
          title: `Page could not be Archived`,
          message: `Sorry, page could not be Archived, please try again later`,
          type: "error",
        })
    );
  };

  const unArchivePage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutatePageDetailsHelper(
      pageService.restorePage(workspaceSlug.toString(), projectId.toString(), pageId.toString()),
      {
        archived_at: null,
      },
      ["description_html"],
      () =>
        actionCompleteAlert({
          title: `Page could not be Restored`,
          message: `Sorry, page could not be Restored, please try again later`,
          type: "error",
        })
    );
  };

  // ========================= Page Lock ==========================
  const lockPage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;
    mutatePageDetailsHelper(
      pageService.lockPage(workspaceSlug.toString(), projectId.toString(), pageId.toString()),
      {
        is_locked: true,
      },
      ["description_html"],
      () =>
        actionCompleteAlert({
          title: `Page cannot be Locked`,
          message: `Sorry, page cannot be Locked, please try again later`,
          type: "error",
        })
    );
  };

  const unlockPage = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutatePageDetailsHelper(
      pageService.unlockPage(workspaceSlug.toString(), projectId.toString(), pageId.toString()),
      {
        is_locked: false,
      },
      ["description_html"],
      () =>
        actionCompleteAlert({
          title: `Page could not be Unlocked`,
          message: `Sorry, page could not be Unlocked, please try again later`,
          type: "error",
        })
    );
  };

  const [localPageDescription, setLocalIssueDescription] = useState({
    id: pageId as string,
    description_html: "",
  });

  // ADDING updatePage TO DEPENDENCY ARRAY PRODUCES ADVERSE EFFECTS
  // TODO: Verify the exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFormSave = useCallback(
    debounce(async () => {
      handleSubmit(updatePage)().finally(() => setIsSubmitting("submitted"));
    }, 1500),
    [handleSubmit, pageDetails]
  );

  if (error)
    return (
      <EmptyState
        image={emptyPage}
        title="Page does not exist"
        description="The page you are looking for does not exist or has been deleted."
        primaryButton={{
          text: "View other pages",
          onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/pages`),
        }}
      />
    );

  const isPageReadOnly =
    pageDetails?.is_locked ||
    pageDetails?.archived_at ||
    (currentProjectRole && [EUserWorkspaceRoles.VIEWER, EUserWorkspaceRoles.GUEST].includes(currentProjectRole));

  const isCurrentUserOwner = pageDetails?.owned_by === user?.id;

  const userCanDuplicate =
    currentProjectRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentProjectRole);
  const userCanArchive = isCurrentUserOwner || currentProjectRole === EUserWorkspaceRoles.ADMIN;
  const userCanLock =
    currentProjectRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentProjectRole);

  return (
    <>
      {pageDetails && issuesResponse ? (
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
                  title: pageDetails.name,
                  created_by: pageDetails.created_by,
                  created_on: pageDetails.created_at,
                  last_updated_at: pageDetails.updated_at,
                  last_updated_by: pageDetails.updated_by,
                }}
                pageLockConfig={
                  userCanLock && !pageDetails.archived_at
                    ? { action: unlockPage, is_locked: pageDetails.is_locked }
                    : undefined
                }
                pageDuplicationConfig={
                  userCanDuplicate && !pageDetails.archived_at ? { action: duplicate_page } : undefined
                }
                pageArchiveConfig={
                  userCanArchive
                    ? {
                        action: pageDetails.archived_at ? unArchivePage : archivePage,
                        is_archived: pageDetails.archived_at ? true : false,
                        archived_at: pageDetails.archived_at ? new Date(pageDetails.archived_at) : undefined,
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
                        title: pageDetails.name,
                        created_by: pageDetails.created_by,
                        created_on: pageDetails.created_at,
                        last_updated_at: pageDetails.updated_at,
                        last_updated_by: pageDetails.updated_by,
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
                              is_archived: pageDetails.archived_at ? true : false,
                              action: pageDetails.archived_at ? unArchivePage : archivePage,
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
                  <>
                    <button
                      type="button"
                      className="absolute right-[68px] top-2.5 flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90"
                      onClick={() => setGptModal((prevData) => !prevData)}
                    >
                      <Sparkle className="h-4 w-4" />
                      AI
                    </button>
                    <GptAssistantModal
                      isOpen={gptModalOpen}
                      handleClose={() => {
                        setGptModal(false);
                      }}
                      inset="top-9 right-[68px] !w-1/2 !max-h-[50%]"
                      content=""
                      onResponse={(response) => {
                        handleAiAssistance(response);
                      }}
                      projectId={projectId.toString()}
                    />
                  </>
                )}
              </div>
            )}
            <IssuePeekOverview
              workspaceSlug={workspaceSlug as string}
              projectId={projectId as string}
              issueId={peekIssueId ? (peekIssueId as string) : ""}
              isArchived={false}
              handleIssue={async (issueToUpdate, action) => {
                if (peekIssueId && typeof peekIssueId === "string") {
                  handleUpdateIssue(peekIssueId, issueToUpdate);
                }
              }}
            />
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
