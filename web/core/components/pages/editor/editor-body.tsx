import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// document-editor
import {
  CollaborativeDocumentEditorWithRef,
  EditorRefApi,
  TAIMenuProps,
  TDisplayConfig,
  TFileHandler,
  TRealtimeConfig,
  TServerHandler,
} from "@plane/editor";
// plane types
import { TSearchEntityRequestPayload, TSearchResponse, TWebhookConnectionQueryParams } from "@plane/types";
// plane ui
import { Row } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor";
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn, LIVE_BASE_PATH, LIVE_BASE_URL } from "@/helpers/common.helper";
import { generateRandomColor } from "@/helpers/string.helper";
// hooks
import { useEditorMention } from "@/hooks/editor";
import { useUser, useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { EditorAIMenu } from "@/plane-web/components/pages";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";
// store
import { TPageInstance } from "@/store/pages/base-page";

export type TEditorBodyConfig = {
  fileHandler: TFileHandler;
};

export type TEditorBodyHandlers = {
  fetchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
};

type Props = {
  config: TEditorBodyConfig;
  editorRef: React.RefObject<EditorRefApi>;
  editorReady: boolean;
  handleConnectionStatus: Dispatch<SetStateAction<boolean>>;
  handleEditorReady: Dispatch<SetStateAction<boolean>>;
  handlers: TEditorBodyHandlers;
  page: TPageInstance;
  sidePeekVisible: boolean;
  webhookConnectionParams: TWebhookConnectionQueryParams;
  workspaceSlug: string;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    config,
    editorRef,
    handleConnectionStatus,
    handleEditorReady,
    handlers,
    page,
    sidePeekVisible,
    webhookConnectionParams,
    workspaceSlug,
  } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const { id: pageId, name: pageTitle, isContentEditable, updateTitle } = page;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";
  // issue-embed
  const { issueEmbedProps } = useIssueEmbed({
    fetchEmbedSuggestions: handlers.fetchEntity,
    workspaceSlug,
  });
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: handlers.fetchEntity,
  });
  // editor flaggings
  const { documentEditor: disabledExtensions } = useEditorFlagging(workspaceSlug);
  // page filters
  const { fontSize, fontStyle, isFullWidth } = usePageFilters();
  // derived values
  const displayConfig: TDisplayConfig = useMemo(
    () => ({
      fontSize,
      fontStyle,
    }),
    [fontSize, fontStyle]
  );

  const getAIMenu = useCallback(
    ({ isOpen, onClose }: TAIMenuProps) => (
      <EditorAIMenu
        editorRef={editorRef}
        isOpen={isOpen}
        onClose={onClose}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
      />
    ),
    [editorRef, workspaceId, workspaceSlug]
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
        queryParams: webhookConnectionParams,
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [webhookConnectionParams]);

  const userConfig = useMemo(
    () => ({
      id: currentUser?.id ?? "",
      name: currentUser?.display_name ?? "",
      color: generateRandomColor(currentUser?.id ?? ""),
    }),
    [currentUser?.display_name, currentUser?.id]
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
            fileHandler={config.fileHandler}
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
