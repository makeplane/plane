"use client";

import { FC, RefObject } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETabIndices } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, TIssue } from "@plane/types";
import { Loader } from "@plane/ui";
import { getDescriptionPlaceholderI18n, getTabIndex } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text/editor";
// hooks
import { useEditorAsset, useProjectInbox } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { WorkspaceService } from "@/plane-web/services";

const workspaceService = new WorkspaceService();

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
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { uploadEditorAsset } = useEditorAsset();
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
      editable
      id="inbox-modal-editor"
      initialValue={!data?.description_html || data?.description_html === "" ? "<p></p>" : data?.description_html}
      ref={editorRef}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
      projectId={projectId}
      dragDropEnabled={false}
      onChange={(_description: object, description_html: string) => handleData("description_html", description_html)}
      placeholder={(isFocused, description) => t(`${getDescriptionPlaceholderI18n(isFocused, description)}`)}
      searchMentionCallback={async (payload) =>
        await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
          ...payload,
          project_id: projectId?.toString() ?? "",
        })
      }
      containerClassName={containerClassName}
      onEnterKeyPress={onEnterKeyPress}
      tabIndex={getIndex("description_html")}
      uploadFile={async (blockId, file) => {
        try {
          const { asset_id } = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: data.id ?? "",
              entity_type: EFileAssetType.ISSUE_DESCRIPTION,
            },
            file,
            projectId,
            workspaceSlug,
          });
          onAssetUpload?.(asset_id);
          return asset_id;
        } catch (error) {
          console.log("Error in uploading work item asset:", error);
          throw new Error("Asset upload failed. Please try again later.");
        }
      }}
    />
  );
});
