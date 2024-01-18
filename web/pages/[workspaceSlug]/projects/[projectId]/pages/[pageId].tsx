import React, { useEffect, useRef, useState, ReactElement, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR, { MutatorOptions } from "swr";
import { Controller, useForm } from "react-hook-form";
import { Sparkle } from "lucide-react";
import debounce from "lodash/debounce";
// hooks
import { useApplication, useUser } from "hooks/store";
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

// services
const fileService = new FileService();
const pageService = new PageService();
const issueService = new IssueService();

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

  const fetchIssue = async (issueId: string) => {
    const issue = await issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string);
    return issue as TIssue;
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
      revalidate: false,
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

  useEffect(() => {
    mutatePageDetails(undefined, {
      revalidate: true,
      populateCache: true,
      rollbackOnError: () => {
        actionCompleteAlert({
          title: `Page could not be updated`,
          message: `Sorry, page could not be updated, please try again later`,
          type: "error",
        });
        return true;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        archived_at: renderFormattedPayloadDate(new Date()),
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
    (currentProjectRole && [EUserProjectRoles.VIEWER, EUserProjectRoles.GUEST].includes(currentProjectRole));

  const isCurrentUserOwner = pageDetails?.owned_by === currentUser?.id;

  const userCanDuplicate =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);
  const userCanArchive = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const userCanLock =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

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
