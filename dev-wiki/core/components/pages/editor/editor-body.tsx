import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// document-editor
import {
  CollaborativeDocumentEditorWithRef,
  EditorRefApi,
  EditorTitleRefApi,
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
import { cn, HSL, hslToHex, isCommentEmpty } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor";
import { PageContentBrowser, PageContentLoader } from "@/components/pages";
// helpers
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@/helpers/common.helper";
// hooks
import { useEditorMention } from "@/hooks/editor";
import { useMember, useUser, useUserProfile, useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
import { type TCustomEventHandlers, useRealtimePageEvents } from "@/hooks/use-realtime-page-events";
// plane web components
import { EditorAIMenu } from "@/plane-web/components/pages";
import { MultipleDeletePagesModal } from "@/plane-web/components/pages/modals/multiple-page-delete-modal";
// plane web store
import { EPageStoreType } from "@/plane-web/hooks/store/use-page-store";
// plane web hooks
import { useEditorEmbeds } from "@/plane-web/hooks/use-editor-embed";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// store
import { TPageInstance } from "@/store/pages/base-page";
import { PageEditorHeaderRoot } from "./header";

// Add a CSS keyframe animation
export type TEditorBodyConfig = {
  fileHandler: TFileHandler;
};

// Define the structure of action-specific data
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
  handlers: TEditorBodyHandlers;
  page: TPageInstance;
  webhookConnectionParams: TWebhookConnectionQueryParams;
  projectId?: string;
  workspaceSlug: string;
  storeType: EPageStoreType;
  customRealtimeEventHandlers?: TCustomEventHandlers;
};

export const generateRandomColor = (input: string): HSL => {
  // If input is falsy, generate a random seed string.
  // The random seed is created by converting a random number to base-36 and taking a substring.
  const seed = input || Math.random().toString(36).substring(2, 8);

  const uniqueId = seed.length.toString() + seed; // Unique identifier based on string length
  const combinedString = uniqueId + seed;

  // Create a hash value from the combined string.
  const hash = Array.from(combinedString).reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return (acc << 5) - acc + charCode;
  }, 0);

  // Derive the HSL values from the hash.
  const hue = Math.abs(hash % 360);
  const saturation = 70; // Maintains a good amount of color
  const lightness = 70; // Increased lightness for a pastel look

  return { h: hue, s: saturation, l: lightness };
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    config,
    editorForwardRef,
    handleConnectionStatus,
    handleEditorReady,
    handlers,
    page,
    storeType,
    webhookConnectionParams,
    projectId,
    workspaceSlug,
    customRealtimeEventHandlers,
  } = props;
  // states
  const [isDescriptionEmpty, setIsDescriptionEmpty] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [deletePageModal, setDeletePageModal] = useState({
    visible: false,
    pages: [page],
  });
  // refs
  const titleEditorRef = useRef<EditorTitleRefApi>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const {
    data: { is_smooth_cursor_enabled },
  } = useUserProfile();
  const { getWorkspaceBySlug } = useWorkspace();
  const { getUserDetails } = useMember();
  // derived values
  const { id: pageId, isContentEditable, editorRef, setSyncingStatus } = page;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";
  const isTitleEmpty = !page.name || page.name.trim() === "";
  // Simple animation effect that triggers on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Slightly longer delay for smoother coordination

    return () => clearTimeout(timer);
  }, []);

  // all editor embeds
  const { embedProps } = useEditorEmbeds({
    fetchEmbedSuggestions: handlers.fetchEntity,
    getRedirectionLink: handlers.getRedirectionLink,
    workspaceSlug,
    page,
    storeType,
    setDeletePageModal,
  });
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: handlers.fetchEntity,
  });
  // editor flaggings
  const { documentEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString(), storeType);
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

  // Use the new hook to handle page events
  const { updatePageProperties } = useRealtimePageEvents({
    storeType,
    page,
    getUserDetails,
    customRealtimeEventHandlers,
    handlers,
  });

  // Set syncing status on initial render
  useEffect(() => {
    setSyncingStatus("syncing");
  }, [setSyncingStatus]);

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
    setSyncingStatus("error");
  }, [handleConnectionStatus, setSyncingStatus]);

  const handleServerSynced = useCallback(() => {
    setSyncingStatus("synced");
  }, [setSyncingStatus]);

  const serverHandler: TServerHandler = useMemo(
    () => ({
      onConnect: handleServerConnect,
      onServerError: handleServerError,
      onServerSynced: handleServerSynced,
    }),
    [handleServerConnect, handleServerError, handleServerSynced]
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

  const isPageLoading = pageId === undefined || !realtimeConfig;
  if (isPageLoading) return <PageContentLoader className={blockWidthClassName} />;

  return (
    <Row
      className={`relative size-full flex flex-col overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md`}
      variant={ERowVariant.HUGGING}
    >
      <div id="page-content-container" className="relative w-full flex-shrink-0">
        {/* table of content */}
        <div className="page-summary-container absolute h-full right-0 top-[64px] z-[5]">
          <div className="sticky top-[72px]">
            <div className="group/page-toc relative px-page-x">
              <div className="cursor-pointer max-h-[50vh] overflow-hidden">
                <PageContentBrowser editorRef={editorRef} showOutline />
              </div>
              <div className="absolute top-0 right-0 opacity-0 translate-x-1/2 pointer-events-none group-hover/page-toc:opacity-100 group-hover/page-toc:-translate-x-1/4 group-hover/page-toc:pointer-events-auto transition-all duration-300 w-52 max-h-[70vh] overflow-y-scroll vertical-scrollbar scrollbar-sm whitespace-nowrap bg-custom-background-90 p-4 rounded">
                <PageContentBrowser editorRef={editorRef} />
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${isVisible ? "animate-editor-fade-in" : "opacity-0"}`}
          style={{
            animation: isVisible ? "editorFadeIn 0.5s var(--ease-out-cubic) forwards" : "none",
            animationDelay: "100ms",
          }}
        >
          <div className="page-header-container group/page-header">
            <div className={blockWidthClassName}>
              <PageEditorHeaderRoot
                titleEditorRef={titleEditorRef}
                isEditorContentEmpty={isDescriptionEmpty && isTitleEmpty}
                isPageLoading={isPageLoading}
                page={page}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
              />
            </div>
          </div>

          <CollaborativeDocumentEditorWithRef
            editable={isContentEditable}
            id={pageId}
            isSmoothCursorEnabled={is_smooth_cursor_enabled}
            fileHandler={config.fileHandler}
            handleEditorReady={handleEditorReady}
            ref={editorForwardRef}
            titleRef={titleEditorRef}
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
            onChange={(_json, html) => {
              setIsDescriptionEmpty(isCommentEmpty(html));
            }}
            updatePageProperties={updatePageProperties}
            embedHandler={embedProps}
            pageRestorationInProgress={page.restoration.inProgress}
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
      <MultipleDeletePagesModal
        editorRef={editorRef}
        isOpen={deletePageModal.visible}
        onClose={() => {
          setDeletePageModal({ visible: false, pages: [] });
        }}
        pages={deletePageModal.pages}
        storeType={storeType}
      />
    </Row>
  );
});
