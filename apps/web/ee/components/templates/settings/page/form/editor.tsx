import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { EFileAssetType, TSearchEntityRequestPayload } from "@plane/types";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/plane-web/services";
const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId?: string;
  templateId: string | undefined;
  initialValue: string;
  onChange: (json: object, html: string) => void;
};

export const PageTemplateEditor = observer((props: Props) => {
  const { workspaceSlug, projectId, templateId, initialValue, onChange } = props;
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const workspaceId = useMemo(
    () => (workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : ""),
    [getWorkspaceBySlug, workspaceSlug]
  );

  return (
    <DocumentEditor
      disabledExtensions={["issue-embed"]}
      editable
      id="page-template-editor"
      value={initialValue}
      onChange={(json, html) => onChange(json, html)}
      containerClassName="min-h-[120px] border-none pl-4 -ml-4"
      uploadFile={async (blockId, file) => {
        const { asset_id } = await uploadEditorAsset({
          blockId,
          file,
          data: {
            entity_identifier: templateId ?? "",
            entity_type: EFileAssetType.PAGE_TEMPLATE_DESCRIPTION,
          },
          workspaceSlug: workspaceSlug?.toString() ?? "",
        });
        return asset_id;
      }}
      searchMentionCallback={async (payload: TSearchEntityRequestPayload) =>
        await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
          ...payload,
          project_id: projectId?.toString() ?? "",
        })
      }
      bubbleMenuEnabled
      projectId={projectId}
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
    />
  );
});
