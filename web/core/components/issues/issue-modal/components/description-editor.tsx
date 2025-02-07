"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
import { Sparkle } from "lucide-react";
// plane imports
import { ETabIndices } from "@plane/constants";
// editor
import { EditorRefApi } from "@plane/editor";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { TIssue } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { GptAssistantPopover } from "@/components/core";
import { RichTextEditor } from "@/components/editor";
// helpers
import { getDescriptionPlaceholderI18n } from "@/helpers/issue.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useInstance, useWorkspace } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// services
import { AIService } from "@/services/ai.service";
import { FileService } from "@/services/file.service";

type TIssueDescriptionEditorProps = {
  control: Control<TIssue>;
  isDraft: boolean;
  issueName: string;
  issueId: string | undefined;
  descriptionHtmlData: string | undefined;
  editorRef: React.MutableRefObject<EditorRefApi | null>;
  submitBtnRef: React.MutableRefObject<HTMLButtonElement | null>;
  gptAssistantModal: boolean;
  workspaceSlug: string;
  projectId: string | null;
  handleFormChange: () => void;
  handleDescriptionHTMLDataChange: (descriptionHtmlData: string) => void;
  setGptAssistantModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleGptAssistantClose: () => void;
  onAssetUpload: (assetId: string) => void;
  onClose: () => void;
};

// services
const workspaceService = new WorkspaceService();
const aiService = new AIService();
const fileService = new FileService();

export const IssueDescriptionEditor: React.FC<TIssueDescriptionEditorProps> = observer((props) => {
  const {
    control,
    isDraft,
    issueName,
    issueId,
    descriptionHtmlData,
    editorRef,
    submitBtnRef,
    gptAssistantModal,
    workspaceSlug,
    projectId,
    handleFormChange,
    handleDescriptionHTMLDataChange,
    setGptAssistantModal,
    handleGptAssistantClose,
    onAssetUpload,
    onClose,
  } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [iAmFeelingLucky, setIAmFeelingLucky] = useState(false);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString())?.id as string;
  const { config } = useInstance();
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  useEffect(() => {
    if (descriptionHtmlData) handleDescriptionHTMLDataChange(descriptionHtmlData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptionHtmlData]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (editorRef.current?.isEditorReadyToDiscard()) {
      onClose();
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      event.preventDefault(); // Prevent default action if editor is not ready to discard
    }
  };

  useKeypress("Escape", handleKeyDown);

  // handlers
  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;

    editorRef.current?.setEditorValueAtCursorPosition(response);
  };

  const handleAutoGenerateDescription = async () => {
    if (!workspaceSlug || !projectId) return;

    setIAmFeelingLucky(true);

    aiService
      .createGptTask(workspaceSlug.toString(), {
        prompt: issueName,
        task: "Generate a proper description for this work item.",
      })
      .then((res) => {
        if (res.response === "")
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message:
              "Work item title isn't informative enough to generate the description. Please try with a different title.",
          });
        else handleAiAssistance(res.response_html);
      })
      .catch((err) => {
        const error = err?.data?.error;

        if (err.status === 429)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error || "You have reached the maximum number of requests of 50 requests per month per user.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error || "Some error occurred. Please try again.",
          });
      })
      .finally(() => setIAmFeelingLucky(false));
  };

  return (
    <div className="border-[0.5px] border-custom-border-200 rounded-lg relative">
      {descriptionHtmlData === undefined || !projectId ? (
        <Loader className="min-h-[120px] max-h-64 space-y-2 overflow-hidden rounded-md border border-custom-border-200 p-3 py-2 pt-3">
          <Loader.Item width="100%" height="26px" />
          <div className="flex items-center gap-2">
            <Loader.Item width="26px" height="26px" />
            <Loader.Item width="400px" height="26px" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item width="26px" height="26px" />
            <Loader.Item width="400px" height="26px" />
          </div>
          <Loader.Item width="80%" height="26px" />
          <div className="flex items-center gap-2">
            <Loader.Item width="50%" height="26px" />
          </div>
          <div className="border-0.5 absolute bottom-2 right-3.5 z-10 flex items-center gap-2">
            <Loader.Item width="100px" height="26px" />
            <Loader.Item width="50px" height="26px" />
          </div>
        </Loader>
      ) : (
        <>
          <Controller
            name="description_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <RichTextEditor
                id="issue-modal-editor"
                initialValue={value ?? ""}
                value={descriptionHtmlData}
                workspaceSlug={workspaceSlug?.toString() as string}
                workspaceId={workspaceId}
                projectId={projectId}
                onChange={(_description: object, description_html: string) => {
                  onChange(description_html);
                  handleFormChange();
                }}
                onEnterKeyPress={() => submitBtnRef?.current?.click()}
                ref={editorRef}
                tabIndex={getIndex("description_html")}
                placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
                searchMentionCallback={async (payload) =>
                  await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                    ...payload,
                    project_id: projectId?.toString() ?? "",
                  })
                }
                containerClassName="pt-3 min-h-[120px]"
                uploadFile={async (file) => {
                  try {
                    const { asset_id } = await fileService.uploadProjectAsset(
                      workspaceSlug,
                      projectId,
                      {
                        entity_identifier: issueId ?? "",
                        entity_type: isDraft
                          ? EFileAssetType.DRAFT_ISSUE_DESCRIPTION
                          : EFileAssetType.ISSUE_DESCRIPTION,
                      },
                      file
                    );
                    onAssetUpload(asset_id);
                    return asset_id;
                  } catch (error) {
                    console.log("Error in uploading issue asset:", error);
                    throw new Error("Asset upload failed. Please try again later.");
                  }
                }}
              />
            )}
          />
          <div className="border-0.5 z-10 flex items-center justify-end gap-2 p-3">
            {issueName && issueName.trim() !== "" && config?.has_openai_configured && (
              <button
                type="button"
                className={`flex items-center gap-1 rounded bg-custom-background-90 hover:bg-custom-background-80 px-1.5 py-1 text-xs ${
                  iAmFeelingLucky ? "cursor-wait" : ""
                }`}
                onClick={handleAutoGenerateDescription}
                disabled={iAmFeelingLucky}
                tabIndex={getIndex("feeling_lucky")}
              >
                {iAmFeelingLucky ? (
                  "Generating response"
                ) : (
                  <>
                    <Sparkle className="h-3.5 w-3.5" />I{"'"}m feeling lucky
                  </>
                )}
              </button>
            )}
            {config?.has_openai_configured && projectId && (
              <GptAssistantPopover
                isOpen={gptAssistantModal}
                handleClose={() => {
                  setGptAssistantModal((prevData) => !prevData);
                  // this is done so that the title do not reset after gpt popover closed
                  handleGptAssistantClose();
                }}
                onResponse={(response) => {
                  handleAiAssistance(response);
                }}
                placement="top-end"
                button={
                  <button
                    tabIndex={-1}
                    type="button"
                    className="flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-90 hover:bg-custom-background-80"
                    onClick={() => setGptAssistantModal((prevData) => !prevData)}
                  >
                    <Sparkle className="h-4 w-4" />
                    AI
                  </button>
                }
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
});
