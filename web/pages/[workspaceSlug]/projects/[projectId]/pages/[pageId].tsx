import React, { useEffect, useRef, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
import { TwitterPicker } from "react-color";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { PageService } from "services/page.service";
import { IssueLabelService } from "services/issue";
import { useDebouncedCallback } from "use-debounce";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CreateUpdateBlockInline, SinglePageBlock } from "components/pages";
import { CreateLabelModal } from "components/labels";
import { CreateBlock } from "components/pages/create-block";
import { PageDetailsHeader } from "components/headers/page-details";
// ui
import { DocumentEditorWithRef } from "@plane/document-editor"
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";

import { CustomSearchSelect, TextArea, Loader, ToggleSwitch, Tooltip } from "@plane/ui";
// images
import emptyPage from "public/empty-state/page.svg";

import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { orderArrayBy } from "helpers/array.helper";
import { EmptyState } from "components/common";
// types
import { NextPageWithLayout } from "types/app";
import { IIssueLabels, IPage, IPageBlock, IProjectMember } from "types";
// fetch-keys
import {
  PAGE_BLOCKS_LIST,
  PAGE_DETAILS,
  PROJECT_DETAILS,
  PROJECT_ISSUE_LABELS,
  USER_PROJECT_VIEW,
} from "constants/fetch-keys";
import { FileService } from "services/file.service";

// services
const projectService = new ProjectService();
const fileService = new FileService();
const projectMemberService = new ProjectMemberService();
const pageService = new PageService();
const issueLabelService = new IssueLabelService();

const PageDetailsPage: NextPageWithLayout = () => {

  const editorRef = useRef<any>(null);

  const [showBlock, setShowBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { handleSubmit, reset, watch, setValue, getValues, formState: { errors }, control } = useForm<IPage>({
    defaultValues: { name: "", description_html: "" },
  });

  // =================== Page Details ======================
  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: pageDetails, error } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_DETAILS(pageId as string) : null,
    workspaceSlug && projectId
      ? () => pageService.getPageDetails(workspaceSlug as string, projectId as string, pageId as string)
      : null
  );

  const { data: pageBlocks } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_BLOCKS_LIST(pageId as string) : null,
    workspaceSlug && projectId
      ? () => pageService.listPageBlocks(workspaceSlug as string, projectId as string, pageId as string)
      : null
  );

  const { data: labels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issueLabelService.getProjectIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectMemberService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // ================ Pages Api Requests ==================
  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    if (!formData.name || formData.name.length === 0 || formData.name === "") return;

    await pageService
      .patchPage(workspaceSlug as string, projectId as string, pageId as string, formData, user)
      .then(() => {
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
    await pageService
      .createPage(workspaceSlug as string, projectId as string, payload, user)
  };

  // ================ Page Menu Actions ==================
  const duplicate_page = async () => {
    const currentPageValues = getValues()
    const formData: Partial<IPage> = {
      name: "Copy of " + currentPageValues.name,
      description_html: currentPageValues.description_html
    }
    await createPage(formData)
  }

  const archivePage = async () => {
    try {
      await pageService.archivePage(
        workspaceSlug as string,
        projectId as string,
        pageId as string
      )
    } catch (e) {
      console.log(e)
    }
  }

  const unArchivePage = async () => {
    try {
      await pageService.removePageFromArchives(
        workspaceSlug as string,
        projectId as string,
        pageId as string
      )
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    if (!pageDetails) return;

    reset({
      ...pageDetails,
    });
  }, [reset, pageDetails]);

  const debouncedFormSave = useDebouncedCallback(async () => {
    console.log("submitting the page")
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
        <div className="flex h-full flex-col justify-between p-5">
          <div className="h-full w-full">
            <Controller
              name="description_html"
              control={control}
              render={({ field: { value, onChange } }) =>
              (
                <DocumentEditorWithRef
                  documentDetails={
                    {
                      title: pageDetails.name
                    }
                  }
                  uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                  deleteFile={fileService.deleteImage}
                  ref={editorRef}
                  debouncedUpdatesEnabled={false}
                  setIsSubmitting={setIsSubmitting}
                  value={
                    !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                      ? watch("description_html")
                      : value
                  }
                  customClassName="tracking-tight self-center w-full max-w-full px-0"
                  onChange={(description_json: Object, description_html: string) => {
                    console.log("saving the form")
                    onChange(description_html);
                    setIsSubmitting("submitting");
                    debouncedFormSave();
                  }}
                  duplicationConfig={
                    {
                      action: duplicate_page
                    }
                  }
                  pageArchiveConfig={
                    {
                      action: archivePage
										}

                  }
                />)
              }
            />
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
