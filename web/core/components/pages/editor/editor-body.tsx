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
import { ERowVariant, Row } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor";
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn, LIVE_BASE_PATH, LIVE_BASE_URL } from "@/helpers/common.helper";
import { generateRandomColor } from "@/helpers/string.helper";
// hooks
import { useUser } from "@/hooks/store";
import { useEditorMention } from "@/hooks/use-editor-mention";
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
  webhookConnectionParams: TWebhookConnectionQueryParams;
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
    workspaceSlug,
  } = props;
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const { id: pageId, name: pageTitle, isContentEditable, updateTitle } = page;
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
      wideLayout: isFullWidth,
    }),
    [fontSize, fontStyle, isFullWidth]
  );

  const getAIMenu = useCallback(
    ({ isOpen, onClose }: TAIMenuProps) => (
      <EditorAIMenu
        editorRef={editorRef}
        isOpen={isOpen}
        onClose={onClose}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
      />
    ),
    [editorRef, workspaceSlug]
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
        queryParams: config.webhookConnectionParams,
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [config.webhookConnectionParams]);

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
    <>
      {/* <div
        className={cn("sticky top-0 hidden h-full flex-shrink-0 -translate-x-full py-5 duration-200 md:block", {
          "translate-x-0": sidePeekVisible,
          "w-[10rem] lg:w-[14rem]": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      >
        {!isFullWidth && (
          <PageContentBrowser editorRef={(isContentEditable ? editorRef : readOnlyEditorRef)?.current} />
        )}
      </div> */}
      <Row
        className="relative size-full flex flex-col gap-y-7 pt-[64px] overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md duration-200"
        variant={ERowVariant.HUGGING}
      >
        <div id="page-content-container" className="relative w-full flex-shrink-0 space-y-7">
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
      </Row>
    </>
  );
});
