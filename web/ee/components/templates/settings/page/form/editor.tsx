import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { DocumentEditorWithRef, TExtensions } from "@plane/editor";
import { TSearchEntityRequestPayload } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { generateRandomColor, hslToHex } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor";
import { IssuePeekOverview } from "@/components/issues";
// hooks
import { useEditorConfig, useEditorMention } from "@/hooks/editor";
import { useEditorAsset, useMember, useUser, useUserProfile, useWorkspace } from "@/hooks/store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";
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
  // store hooks
  const { data: currentUser } = useUser();
  const {
    data: { is_smooth_cursor_enabled },
  } = useUserProfile();
  const { getUserDetails } = useMember();
  const { getWorkspaceBySlug } = useWorkspace();
  const { uploadEditorAsset } = useEditorAsset();
  const { getEditorFileHandlers } = useEditorConfig();
  const { documentEditor: documentEditorDisabledExtensions } = useEditorFlagging(workspaceSlug);
  // derived values
  const additionalDisabledExtensions: TExtensions[] = ["issue-embed"];
  const disabledExtensions = [...documentEditorDisabledExtensions, ...additionalDisabledExtensions];
  const workspaceId = useMemo(
    () => (workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : ""),
    [getWorkspaceBySlug, workspaceSlug]
  );
  // user config
  const userConfig = useMemo(
    () => ({
      id: currentUser?.id ?? "",
      name: currentUser?.display_name ?? "",
      color: hslToHex(generateRandomColor(currentUser?.id ?? "")),
    }),
    [currentUser?.display_name, currentUser?.id]
  );
  // editor configs
  // file handler
  const fileHandler = useMemo(
    () =>
      getEditorFileHandlers({
        uploadFile: async (blockId, file) => {
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
        },
        workspaceId,
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }),
    [getEditorFileHandlers, templateId, uploadEditorAsset, workspaceId, workspaceSlug]
  );
  // entity search handler
  const fetchEntityCallback = useCallback(
    async (payload: TSearchEntityRequestPayload) =>
      await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
        ...payload,
        project_id: projectId?.toString() ?? "",
      }),
    [projectId, workspaceSlug]
  );
  // issue-embed
  const { issueEmbedProps } = useIssueEmbed({
    fetchEmbedSuggestions: fetchEntityCallback,
    workspaceSlug,
  });
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: fetchEntityCallback,
  });

  return (
    <>
      <DocumentEditorWithRef
        disabledExtensions={disabledExtensions}
        fileHandler={fileHandler}
        id="page-template-editor"
        initialValue={initialValue}
        onChange={(json, html) => onChange(json, html)}
        user={userConfig}
        embedHandler={{
          issue: issueEmbedProps,
        }}
        mentionHandler={{
          searchCallback: async (query) => {
            const res = await fetchMentions(query);
            if (!res) throw new Error("Failed in fetching mentions");
            return res;
          },
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
          getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
        }}
        containerClassName="min-h-[120px] border-none"
        isSmoothCursorEnabled={is_smooth_cursor_enabled}
      />
      <IssuePeekOverview />
    </>
  );
});
