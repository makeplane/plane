import React, { useEffect, useRef, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
// services
import { PageService } from "services/page.service";
import { useDebouncedCallback } from "use-debounce";
// hooks
import useUser from "hooks/use-user";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PageDetailsHeader } from "components/headers/page-details";
import { EmptyState } from "components/common";
// ui
import { DocumentEditorWithRef, DocumentReadOnlyEditorWithRef } from "@plane/document-editor";
import { Loader } from "@plane/ui";
// assets
import emptyPage from "public/empty-state/page.svg";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { NextPageWithLayout } from "types/app";
import { IPage } from "types";
// fetch-keys
import { PAGE_DETAILS } from "constants/fetch-keys";
import { FileService } from "services/file.service";

// services
const fileService = new FileService();
const pageService = new PageService();

const PageDetailsPage: NextPageWithLayout = () => {
  const editorRef = useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { user } = useUser();

  const { handleSubmit, reset, getValues, control } = useForm<IPage>({
    defaultValues: { name: "" },
  });

  // =================== Fetching Page Details ======================
  const { data: pageDetails, error } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_DETAILS(pageId as string) : null,
    workspaceSlug && projectId
      ? () => pageService.getPageDetails(workspaceSlug as string, projectId as string, pageId as string)
      : null
  );

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    if (!formData.name || formData.name.length === 0 || formData.name === "") return;

    await pageService.patchPage(workspaceSlug as string, projectId as string, pageId as string, formData).then(() => {
      mutate<IPage>(
        PAGE_DETAILS(pageId as string),
        (prevData) => ({
          ...prevData,
          ...formData,
        }),
        false
      );
    });
  };

  const createPage = async (payload: Partial<IPage>) => {
    await pageService.createPage(workspaceSlug as string, projectId as string, payload);
  };

  // ================ Page Menu Actions ==================
  const duplicate_page = async () => {
    const currentPageValues = getValues();
    const formData: Partial<IPage> = {
      name: "Copy of " + currentPageValues.name,
      description_html: currentPageValues.description_html,
    };
    await createPage(formData);
  };

  const archivePage = async () => {
    try {
      await pageService.archivePage(workspaceSlug as string, projectId as string, pageId as string).then(() => {
        mutate<IPage>(
          PAGE_DETAILS(pageId as string),
          (prevData) => {
            if (prevData && prevData.is_locked) {
              prevData.archived_at = renderDateFormat(new Date());
              return prevData;
            }
          },
          true
        );
      });
    } catch (e) {
      console.log(e);
    }
  };

  const unArchivePage = async () => {
    try {
      await pageService.restorePage(workspaceSlug as string, projectId as string, pageId as string).then(() => {
        mutate<IPage>(
          PAGE_DETAILS(pageId as string),
          (prevData) => {
            if (prevData && prevData.is_locked) {
              prevData.archived_at = null;
              return prevData;
            }
          },
          true
        );
      });
    } catch (e) {
      console.log(e);
    }
  };

  // ========================= Page Lock ==========================
  const lockPage = async () => {
    try {
      await pageService.lockPage(workspaceSlug as string, projectId as string, pageId as string).then(() => {
        mutate<IPage>(
          PAGE_DETAILS(pageId as string),
          (prevData) => {
            if (prevData && prevData.is_locked) {
              prevData.is_locked = true;
            }
            return prevData;
          },
          true
        );
      });
    } catch (e) {
      console.log(e);
    }
  };

  const unlockPage = async () => {
    try {
      await pageService.unlockPage(workspaceSlug as string, projectId as string, pageId as string).then(() => {
        mutate<IPage>(
          PAGE_DETAILS(pageId as string),
          (prevData) => {
            if (prevData && prevData.is_locked) {
              prevData.is_locked = false;
              return prevData;
            }
          },
          true
        );
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!pageDetails) return;

    reset({
      ...pageDetails,
    });
  }, [reset, pageDetails]);

  const debouncedFormSave = useDebouncedCallback(async () => {
    handleSubmit(updatePage)().finally(() => setIsSubmitting("submitted"));
  }, 1500);

  return (
    <>
      {error ? (
        <EmptyState
          image={emptyPage}
          title="Page does not exist"
          description="The page you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other pages",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/pages`),
          }}
        />
      ) : pageDetails ? (
        <div className="flex h-full flex-col justify-between pl-5 pr-5">
          <div className="h-full w-full">
            {pageDetails.is_locked || pageDetails.archived_at ? (
              <DocumentReadOnlyEditorWithRef
                ref={editorRef}
                value={pageDetails.description_html}
                customClassName={"tracking-tight self-center w-full max-w-full px-0"}
                borderOnFocus={false}
                noBorder={true}
                documentDetails={{
                  title: pageDetails.name,
                  created_by: pageDetails.created_by,
                  created_on: pageDetails.created_at,
                  last_updated_at: pageDetails.updated_at,
                  last_updated_by: pageDetails.updated_by,
                }}
                pageLockConfig={
                  !pageDetails.archived_at && user && pageDetails.owned_by === user.id
                    ? { action: unlockPage, is_locked: pageDetails.is_locked }
                    : undefined
                }
                pageArchiveConfig={
                  user && pageDetails.owned_by === user.id
                    ? {
                        action: pageDetails.archived_at ? unArchivePage : archivePage,
                        is_archived: pageDetails.archived_at ? true : false,
                        archived_at: pageDetails.archived_at ? new Date(pageDetails.archived_at) : undefined,
                      }
                    : undefined
                }
              />
            ) : (
              <Controller
                name="description_html"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DocumentEditorWithRef
                    documentDetails={{
                      title: pageDetails.name,
                      created_by: pageDetails.created_by,
                      created_on: pageDetails.created_at,
                      last_updated_at: pageDetails.updated_at,
                      last_updated_by: pageDetails.updated_by,
                    }}
                    uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                    deleteFile={fileService.deleteImage}
                    ref={editorRef}
                    debouncedUpdatesEnabled={false}
                    setIsSubmitting={setIsSubmitting}
                    value={!value || value === "" ? "<p></p>" : value}
                    customClassName="tracking-tight self-center px-0 h-full w-full"
                    onChange={(_description_json: Object, description_html: string) => {
                      onChange(description_html);
                      setIsSubmitting("submitting");
                      debouncedFormSave();
                    }}
                    duplicationConfig={{ action: duplicate_page }}
                    pageArchiveConfig={
                      user && pageDetails.owned_by === user.id
                        ? {
                            is_archived: pageDetails.archived_at ? true : false,
                            action: pageDetails.archived_at ? unArchivePage : archivePage,
                          }
                        : undefined
                    }
                    pageLockConfig={
                      user && pageDetails.owned_by === user.id ? { is_locked: false, action: lockPage } : undefined
                    }
                  />
                )}
              />
            )}
          </div>
        </div>
      ) : (
        <Loader className="p-8">
          <Loader.Item height="200px" />
        </Loader>
      )}
    </>
  );
};

PageDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PageDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default PageDetailsPage;
