"use client";

import { FC, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import { TIssue } from "@plane/types";
import { Button, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { InboxIssueTitle, InboxIssueDescription, InboxIssueProperties } from "@/components/inbox/modals/create-modal";
// constants
import { ISSUE_CREATED } from "@/constants/event-tracker";
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useEventTracker, useProject, useProjectInbox, useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import useKeypress from "@/hooks/use-keypress";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { DeDupeButtonRoot, DuplicateModalRoot } from "@/plane-web/components/de-dupe";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
import { FileService } from "@/services/file.service";

const fileService = new FileService();

type TInboxIssueCreateRoot = {
  workspaceSlug: string;
  projectId: string;
  handleModalClose: () => void;
  isDuplicateModalOpen: boolean;
  handleDuplicateIssueModal: (value: boolean) => void;
};

export const defaultIssueData: Partial<TIssue> = {
  id: undefined,
  name: "",
  description_html: "",
  priority: "none",
  state_id: "",
  label_ids: [],
  assignee_ids: [],
  start_date: renderFormattedPayloadDate(new Date()),
  target_date: "",
};

export const InboxIssueCreateRoot: FC<TInboxIssueCreateRoot> = observer((props) => {
  const { workspaceSlug, projectId, handleModalClose, isDuplicateModalOpen, handleDuplicateIssueModal } = props;
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const { createInboxIssue } = useProjectInbox();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const { isMobile } = usePlatformOS();
  const { getProjectById } = useProject();
  // states
  const [createMore, setCreateMore] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TIssue>>(defaultIssueData);
  const handleFormData = useCallback(
    <T extends keyof Partial<TIssue>>(issueKey: T, issueValue: Partial<TIssue>[T]) => {
      setFormData({
        ...formData,
        [issueKey]: issueValue,
      });
    },
    [formData]
  );

  // derived values
  const projectDetails = projectId ? getProjectById(projectId) : undefined;

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);

  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(projectDetails?.workspace.toString(), projectId, {
    name: formData?.name,
    description_html: formData?.description_html,
  });

  const handleEscKeyDown = (event: KeyboardEvent) => {
    if (descriptionEditorRef.current?.isEditorReadyToDiscard()) {
      handleModalClose();
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      event.preventDefault(); // Prevent default action if editor is not ready to discard
    }
  };

  useKeypress("Escape", handleEscKeyDown);

  useEffect(() => {
    const formElement = formRef?.current;
    const modalElement = modalContainerRef?.current;

    if (!formElement || !modalElement) return;

    const resizeObserver = new ResizeObserver(() => {
      modalElement.style.maxHeight = `${formElement?.offsetHeight}px`;
    });

    resizeObserver.observe(formElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [formRef, modalContainerRef]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!descriptionEditorRef.current?.isEditorReadyToDiscard()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      return;
    }

    const payload: Partial<TIssue> = {
      name: formData.name || "",
      description_html: formData.description_html || "<p></p>",
      priority: formData.priority || "none",
      state_id: formData.state_id || "",
      label_ids: formData.label_ids || [],
      assignee_ids: formData.assignee_ids || [],
      target_date: formData.target_date || null,
    };
    setFormSubmitting(true);

    await createInboxIssue(workspaceSlug, projectId, payload)
      .then(async (res) => {
        if (uploadedAssetIds.length > 0) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId, res?.issue.id ?? "", {
            asset_ids: uploadedAssetIds,
          });
          setUploadedAssetIds([]);
        }
        if (!createMore) {
          router.push(`/${workspaceSlug}/projects/${projectId}/inbox/?currentTab=open&inboxIssueId=${res?.issue?.id}`);
          handleModalClose();
        } else {
          descriptionEditorRef?.current?.clearEditor();
          setFormData(defaultIssueData);
        }
        captureIssueEvent({
          eventName: ISSUE_CREATED,
          payload: {
            ...formData,
            state: "SUCCESS",
            element: "Inbox page",
          },
          path: pathname,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `Success!`,
          message: "Issue created successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
        captureIssueEvent({
          eventName: ISSUE_CREATED,
          payload: {
            ...formData,
            state: "FAILED",
            element: "Inbox page",
          },
          path: pathname,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `Error!`,
          message: "Some error occurred. Please try again.",
        });
      });
    setFormSubmitting(false);
  };

  const isTitleLengthMoreThan255Character = formData?.name ? formData.name.length > 255 : false;

  const shouldRenderDuplicateModal = isDuplicateModalOpen && duplicateIssues?.length > 0;

  if (!workspaceSlug || !projectId || !workspaceId) return <></>;
  return (
    <div className="flex gap-2 bg-transparent w-full">
      <div className="rounded-lg w-full">
        <form ref={formRef} onSubmit={handleFormSubmit} className="flex flex-col w-full">
          <div className="space-y-5 p-5 rounded-t-lg bg-custom-background-100">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-medium text-custom-text-200">Create intake issue</h3>
              {duplicateIssues?.length > 0 && (
                <DeDupeButtonRoot
                  workspaceSlug={workspaceSlug}
                  isDuplicateModalOpen={isDuplicateModalOpen}
                  label={`${duplicateIssues.length} duplicate issue${duplicateIssues.length > 1 ? "s" : ""} found!`}
                  handleOnClick={() => handleDuplicateIssueModal(!isDuplicateModalOpen)}
                />
              )}
            </div>
            <div className="space-y-3">
              <InboxIssueTitle
                data={formData}
                handleData={handleFormData}
                isTitleLengthMoreThan255Character={isTitleLengthMoreThan255Character}
              />
              <InboxIssueDescription
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                workspaceId={workspaceId}
                data={formData}
                handleData={handleFormData}
                editorRef={descriptionEditorRef}
                containerClassName="border-[0.5px] border-custom-border-200 py-3 min-h-[150px]"
                onEnterKeyPress={() => submitBtnRef?.current?.click()}
                onAssetUpload={(assetId) => setUploadedAssetIds((prev) => [...prev, assetId])}
              />
              <InboxIssueProperties projectId={projectId} data={formData} handleData={handleFormData} />
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-custom-border-200 rounded-b-lg bg-custom-background-100">
            <div
              className="inline-flex items-center gap-1.5 cursor-pointer"
              onClick={() => setCreateMore((prevData) => !prevData)}
              role="button"
              tabIndex={getIndex("create_more")}
            >
              <ToggleSwitch value={createMore} onChange={() => {}} size="sm" />
              <span className="text-xs">Create more</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="neutral-primary"
                size="sm"
                type="button"
                onClick={() => {
                  if (descriptionEditorRef.current?.isEditorReadyToDiscard()) {
                    handleModalClose();
                  } else {
                    setToast({
                      type: TOAST_TYPE.ERROR,
                      title: "Error!",
                      message: "Editor is still processing changes. Please wait before proceeding.",
                    });
                  }
                }}
                tabIndex={getIndex("discard_button")}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                ref={submitBtnRef}
                size="sm"
                type="submit"
                loading={formSubmitting}
                disabled={isTitleLengthMoreThan255Character}
                tabIndex={getIndex("submit_button")}
              >
                {formSubmitting ? "Creating" : "Create Issue"}
              </Button>
            </div>
          </div>
        </form>
      </div>
      {shouldRenderDuplicateModal && (
        <div
          ref={modalContainerRef}
          className="relative flex flex-col gap-2.5 px-3 py-4 rounded-lg shadow-xl bg-pi-50"
          style={{ maxHeight: formRef?.current?.offsetHeight ? `${formRef.current.offsetHeight}px` : "436px" }}
        >
          <DuplicateModalRoot
            workspaceSlug={workspaceSlug.toString()}
            issues={duplicateIssues}
            handleDuplicateIssueModal={handleDuplicateIssueModal}
          />
        </div>
      )}
    </div>
  );
});
