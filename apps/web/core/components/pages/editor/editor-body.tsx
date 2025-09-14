import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@plane/constants";
import {
  CollaborativeDocumentEditorWithRef,
  type EditorRefApi,
  type TAIMenuProps,
  type TDisplayConfig,
  type TFileHandler,
  type TRealtimeConfig,
  type TServerHandler,
} from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TSearchEntityRequestPayload, TSearchResponse, TWebhookConnectionQueryParams } from "@plane/types";
import { ERowVariant, Row } from "@plane/ui";
import { cn, generateRandomColor, hslToHex } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor/embeds/mentions";
// hooks
import { useEditorMention } from "@/hooks/editor";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web imports
import { EditorAIMenu } from "@/plane-web/components/pages";
import type { TExtendedEditorExtensionsConfig } from "@/plane-web/hooks/pages";
import { EPageStoreType } from "@/plane-web/hooks/store";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageContentLoader } from "../loaders/page-content-loader";
import { PageEditorHeaderRoot } from "./header";
import { PageContentBrowser } from "./summary";
import { PageEditorTitle } from "./title";

export type TEditorBodyConfig = {
  fileHandler: TFileHandler;
};

export type TEditorBodyHandlers = {
  fetchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  getRedirectionLink: (pageId?: string) => string;
};

type Props = {
  config: TEditorBodyConfig;
  editorReady: boolean;
  editorForwardRef: React.RefObject<EditorRefApi>;
  handleConnectionStatus: Dispatch<SetStateAction<boolean>>;
  handleEditorReady: (status: boolean) => void;
  handleOpenNavigationPane: () => void;
  handlers: TEditorBodyHandlers;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
  webhookConnectionParams: TWebhookConnectionQueryParams;
  projectId: string;
  workspaceSlug: string;
  storeType: EPageStoreType;

  extendedEditorProps: TExtendedEditorExtensionsConfig;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    config,
    editorForwardRef,
    handleConnectionStatus,
    handleEditorReady,
    handleOpenNavigationPane,
    handlers,
    isNavigationPaneOpen,
    page,
    storeType,
    webhookConnectionParams,
    projectId,
    workspaceSlug,
    extendedEditorProps,
  } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  const { getUserDetails } = useMember();
  // derived values
  const {
    id: pageId,
    name: pageTitle,
    isContentEditable,
    updateTitle,
    editor: { editorRef, updateAssetsList },
  } = page;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: handlers.fetchEntity,
  });
  // editor flaggings
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug,
    storeType,
  });
  // page filters
  const { fontSize, fontStyle, isFullWidth } = usePageFilters();
  // translation
  const { t } = useTranslation();
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
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
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
      color: hslToHex(generateRandomColor(currentUser?.id ?? "")),
    }),
    [currentUser?.display_name, currentUser?.id]
  );

  const blockWidthClassName = cn(
    "block bg-transparent w-full max-w-[720px] mx-auto transition-all duration-200 ease-in-out",
    {
      "max-w-[1152px]": isFullWidth,
    }
  );

  if (pageId === undefined || !realtimeConfig) return <PageContentLoader className={blockWidthClassName} />;

  return (
    <Row
      className="relative size-full flex flex-col overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md duration-200"
      variant={ERowVariant.HUGGING}
    >
      <div id="page-content-container" className="relative w-full flex-shrink-0">
        {/* table of content */}
        {!isNavigationPaneOpen && (
          <div className="page-summary-container absolute h-full right-0 top-[64px] z-[5]">
            <div className="sticky top-[72px]">
              <div className="group/page-toc relative px-page-x">
                <div
                  className="!cursor-pointer max-h-[50vh] overflow-hidden"
                  role="button"
                  aria-label={t("page_navigation_pane.outline_floating_button")}
                  onClick={handleOpenNavigationPane}
                >
                  <PageContentBrowser className="overflow-y-auto" editorRef={editorRef} showOutline />
                </div>
                <div className="absolute top-0 right-0 opacity-0 translate-x-1/2 pointer-events-none group-hover/page-toc:opacity-100 group-hover/page-toc:-translate-x-1/4 group-hover/page-toc:pointer-events-auto transition-all duration-300 w-52 max-h-[70vh] overflow-y-scroll vertical-scrollbar scrollbar-sm whitespace-nowrap bg-custom-background-90 p-4 rounded">
                  <PageContentBrowser className="overflow-y-auto" editorRef={editorRef} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="page-header-container group/page-header">
          <div className={blockWidthClassName}>
            <PageEditorHeaderRoot page={page} projectId={projectId} />
            <PageEditorTitle
              editorRef={editorRef}
              readOnly={!isContentEditable}
              title={pageTitle}
              updateTitle={updateTitle}
            />
          </div>
        </div>
        <CollaborativeDocumentEditorWithRef
          editable={isContentEditable}
          id={pageId}
          fileHandler={config.fileHandler}
          handleEditorReady={handleEditorReady}
          ref={editorForwardRef}
          containerClassName="h-full p-0 pb-64"
          displayConfig={displayConfig}
          mentionHandler={{
            searchCallback: async (query) => {
              const res = await fetchMentions(query);
              if (!res) throw new Error("Failed in fetching mentions");
              return res;
            },
            renderComponent: (props) => <EditorMentionsRoot {...props} />,
            getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
          }}
          realtimeConfig={realtimeConfig}
          serverHandler={serverHandler}
          user={userConfig}
          disabledExtensions={documentEditorExtensions.disabled}
          flaggedExtensions={documentEditorExtensions.flagged}
          aiHandler={{
            menu: getAIMenu,
          }}
          onAssetChange={updateAssetsList}
          extendedEditorProps={extendedEditorProps}
        />
      </div>
    </Row>
  );
});
