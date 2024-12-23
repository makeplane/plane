import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// document-editor
import {
  CollaborativeDocumentEditorWithRef,
  EditorRefApi,
  TAIMenuProps,
  TDisplayConfig,
  TRealtimeConfig,
  TServerHandler,
} from "@plane/editor";
// types
import { EFileAssetType } from "@plane/types/src/enums";
// components
import { Row } from "@plane/ui";
import { EditorMentionsRoot } from "@/components/editor";
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn, LIVE_BASE_PATH, LIVE_BASE_URL } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { generateRandomColor } from "@/helpers/string.helper";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";
import { useEditorMention } from "@/hooks/use-editor-mention";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { EditorAIMenu } from "@/plane-web/components/pages";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";
// services
import { FileService } from "@/services/file.service";
import { ProjectService } from "@/services/project";
// store
import { IPage } from "@/store/pages/page";
// services init
const fileService = new FileService();
const projectService = new ProjectService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  editorReady: boolean;
  handleConnectionStatus: Dispatch<SetStateAction<boolean>>;
  handleEditorReady: Dispatch<SetStateAction<boolean>>;
  page: IPage;
  sidePeekVisible: boolean;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const { editorRef, handleConnectionStatus, handleEditorReady, page, sidePeekVisible } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "") : "";
  const pageId = page?.id;
  const pageTitle = page?.name ?? "";
  const { isContentEditable, updateTitle } = page;
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: async (payload) =>
      await projectService.searchEntity(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "", payload),
  });
  // editor flaggings
  const { documentEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // page filters
  const { fontSize, fontStyle, isFullWidth } = usePageFilters();
  // issue-embed
  const { issueEmbedProps } = useIssueEmbed(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "");
  // file size
  const { maxFileSize } = useFileSize();

  const displayConfig: TDisplayConfig = {
    fontSize,
    fontStyle,
  };

  const getAIMenu = useCallback(
    ({ isOpen, onClose }: TAIMenuProps) => (
      <EditorAIMenu
        editorRef={editorRef}
        isOpen={isOpen}
        onClose={onClose}
        projectId={projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
      />
    ),
    [editorRef, projectId, workspaceSlug]
  );

  const handleServerConnect = useCallback(() => {
    handleConnectionStatus(false);
  }, [handleConnectionStatus]);

  const handleServerError = useCallback(() => {
    handleConnectionStatus(true);
  }, [handleConnectionStatus]);

  const serverHandler: TServerHandler = useMemo(
    () => ({
      onConnect: handleServerConnect,
      onServerError: handleServerError,
    }),
    [handleServerConnect, handleServerError]
  );

  const realtimeConfig: TRealtimeConfig | undefined = useMemo(() => {
    // Construct the WebSocket Collaboration URL
    try {
      const LIVE_SERVER_BASE_URL = LIVE_BASE_URL?.trim() || window.location.origin;
      const WS_LIVE_URL = new URL(LIVE_SERVER_BASE_URL);
      const isSecureEnvironment = window.location.protocol === "https:";
      WS_LIVE_URL.protocol = isSecureEnvironment ? "wss" : "ws";
      WS_LIVE_URL.pathname = `${LIVE_BASE_PATH}/collaboration`;
      // Construct realtime config
      return {
        url: WS_LIVE_URL.toString(),
        queryParams: {
          workspaceSlug: workspaceSlug?.toString(),
          projectId: projectId?.toString(),
          documentType: "project_page",
        },
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [projectId, workspaceSlug]);

  const userConfig = useMemo(
    () => ({
      id: currentUser?.id ?? "",
      name: currentUser?.display_name ?? "",
      color: generateRandomColor(currentUser?.id ?? ""),
    }),
    [currentUser]
  );

  if (pageId === undefined || !realtimeConfig) return <PageContentLoader />;

  return (
    <div className="flex items-center h-full w-full overflow-y-auto">
      <Row
        className={cn("sticky top-0 hidden h-full flex-shrink-0 -translate-x-full py-5 duration-200 md:block", {
          "translate-x-0": sidePeekVisible,
          "w-[10rem] lg:w-[14rem]": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      >
        {!isFullWidth && <PageContentBrowser editorRef={editorRef.current} />}
      </Row>
      <div
        className={cn("size-full pt-5 duration-200", {
          "md:w-[calc(100%-10rem)] xl:w-[calc(100%-28rem)]": !isFullWidth,
          "md:w-[90%]": isFullWidth,
        })}
      >
        <div className="size-full flex flex-col gap-y-7 overflow-y-auto overflow-x-hidden">
          <PageEditorTitle
            editorRef={editorRef}
            title={pageTitle}
            updateTitle={updateTitle}
            readOnly={!isContentEditable}
          />
          <CollaborativeDocumentEditorWithRef
            editable={isContentEditable}
            id={pageId}
            fileHandler={getEditorFileHandlers({
              maxFileSize,
              projectId: projectId?.toString() ?? "",
              uploadFile: async (file) => {
                const { asset_id } = await fileService.uploadProjectAsset(
                  workspaceSlug?.toString() ?? "",
                  projectId?.toString() ?? "",
                  {
                    entity_identifier: pageId,
                    entity_type: EFileAssetType.PAGE_DESCRIPTION,
                  },
                  file
                );
                return asset_id;
              },
              workspaceId,
              workspaceSlug: workspaceSlug?.toString() ?? "",
            })}
            handleEditorReady={handleEditorReady}
            ref={editorRef}
            containerClassName="h-full p-0 pb-64"
            displayConfig={displayConfig}
            editorClassName="pl-10"
            mentionHandler={{
              searchCallback: async (query) => {
                const res = await fetchMentions(query);
                if (!res) throw new Error("Failed in fetching mentions");
                return res;
              },
              renderComponent: (props) => <EditorMentionsRoot {...props} />,
            }}
            embedHandler={{
              issue: issueEmbedProps,
            }}
            realtimeConfig={realtimeConfig}
            serverHandler={serverHandler}
            user={userConfig}
            disabledExtensions={disabledExtensions}
            aiHandler={{
              menu: getAIMenu,
            }}
          />
        </div>
      </div>
      <div
        className={cn("hidden xl:block flex-shrink-0 duration-200", {
          "w-[10rem] lg:w-[14rem]": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      />
    </div>
  );
});
