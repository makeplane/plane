"use client";

import { FC, RefObject } from "react";
import { observer } from "mobx-react";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import { TIssue } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Loader } from "@plane/ui";
// components
import { RichTextEditor } from "@/components/editor/rich-text-editor/rich-text-editor";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useProjectInbox } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

type TInboxIssueDescription = {
  containerClassName?: string;
  workspaceSlug: string;
  projectId: string;
  workspaceId: string;
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  editorRef: RefObject<EditorRefApi>;
  onEnterKeyPress?: (e?: any) => void;
  onAssetUpload?: (assetId: string) => void;
};

// TODO: have to implement GPT Assistance
export const InboxIssueDescription: FC<TInboxIssueDescription> = observer((props) => {
  const {
    containerClassName,
    workspaceSlug,
    projectId,
    workspaceId,
    data,
    handleData,
    editorRef,
    onEnterKeyPress,
    onAssetUpload,
  } = props;
  // hooks
  const { loader } = useProjectInbox();
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);

  if (loader === "issue-loading")
    return (
      <Loader className="min-h-[6rem] rounded-md border border-custom-border-200">
        <Loader.Item width="100%" height="140px" />
      </Loader>
    );

  return (
    <RichTextEditor
      id="inbox-modal-editor"
      initialValue={!data?.description_html || data?.description_html === "" ? "<p></p>" : data?.description_html}
      ref={editorRef}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
      projectId={projectId}
      dragDropEnabled={false}
      onChange={(_description: object, description_html: string) => handleData("description_html", description_html)}
      placeholder={getDescriptionPlaceholder}
      containerClassName={containerClassName}
      onEnterKeyPress={onEnterKeyPress}
      tabIndex={getIndex("description_html")}
      uploadFile={async (file) => {
        try {
          const { asset_id } = await fileService.uploadProjectAsset(
            workspaceSlug,
            projectId,
            {
              entity_identifier: data.id ?? "",
              entity_type: EFileAssetType.ISSUE_DESCRIPTION,
            },
            file
          );
          onAssetUpload?.(asset_id);
          return asset_id;
        } catch (error) {
          console.log("Error in uploading issue asset:", error);
          throw new Error("Asset upload failed. Please try again later.");
        }
      }}
    />
  );
});
