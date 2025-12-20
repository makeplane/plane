import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { CollaborationState, EditorRefApi } from "@plane/editor";
import type { TDocumentPayload, TPage, TPageVersion, TWebhookConnectionQueryParams } from "@plane/types";
// hooks
import { usePageFallback } from "@/hooks/use-page-fallback";
// plane web import
import type { PageUpdateHandler, TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
import { PageModals } from "@/plane-web/components/pages";
import { usePagesPaneExtensions, useExtendedEditorProps } from "@/plane-web/hooks/pages";
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneRoot } from "../navigation-pane";
import { PageVersionsOverlay } from "../version";
import { PagesVersionEditor } from "../version/editor";
import { ContentLimitBanner } from "./content-limit-banner";
import { PageEditorBody } from "./editor-body";
import type { TEditorBodyConfig, TEditorBodyHandlers } from "./editor-body";
import { PageEditorToolbarRoot } from "./toolbar";

export type TPageRootHandlers = {
  create: (payload: Partial<TPage>) => Promise<Partial<TPage> | undefined>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  fetchDescriptionBinary: () => Promise<ArrayBuffer>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  restoreVersion: (pageId: string, versionId: string) => Promise<void>;
  updateDescription: (document: TDocumentPayload) => Promise<void>;
} & TEditorBodyHandlers;

export type TPageRootConfig = TEditorBodyConfig;

type TPageRootProps = {
  config: TPageRootConfig;
  handlers: TPageRootHandlers;
  page: TPageInstance;
  storeType: EPageStoreType;
  webhookConnectionParams: TWebhookConnectionQueryParams;
  projectId?: string;
  workspaceSlug: string;
  customRealtimeEventHandlers?: TCustomEventHandlers;
};

export const PageRoot = observer(function PageRoot(props: TPageRootProps) {
  const {
    config,
    handlers,
    page,
    projectId,
    storeType,
    webhookConnectionParams,
    workspaceSlug,
    customRealtimeEventHandlers,
  } = props;
  // states
  const [editorReady, setEditorReady] = useState(false);
  const [collaborationState, setCollaborationState] = useState<CollaborationState | null>(null);
  const [showContentTooLargeBanner, setShowContentTooLargeBanner] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // derived values
  const {
    isContentEditable,
    editor: { setEditorRef },
  } = page;
  // page fallback
  const { isFetchingFallbackBinary } = usePageFallback({
    editorRef,
    fetchPageDescription: handlers.fetchDescriptionBinary,
    page,
    collaborationState,
    updatePageDescription: handlers.updateDescription,
  });

  const handleEditorReady = useCallback(
    (status: boolean) => {
      setEditorReady(status);
      if (editorRef.current && !page.editor.editorRef) {
        setEditorRef(editorRef.current);
      }
    },
    [page.editor.editorRef, setEditorRef]
  );

  useEffect(() => {
    setTimeout(() => {
      setEditorRef(editorRef.current);
    }, 0);
  }, [isContentEditable, setEditorRef]);

  // Get extensions and navigation logic from hook
  const {
    editorExtensionHandlers,
    navigationPaneExtensions,
    handleOpenNavigationPane,
    handleCloseNavigationPane,
    isNavigationPaneOpen,
  } = usePagesPaneExtensions({
    page,
    editorRef,
  });

  // Type-safe error handler for content too large errors
  const errorHandler: PageUpdateHandler<"error"> = (params) => {
    const { data } = params;

    // Check if it's content too large error
    if (data.error_code === "content_too_large") {
      setShowContentTooLargeBanner(true);
    }

    // Call original error handler if exists
    customRealtimeEventHandlers?.error?.(params);
  };

  const mergedCustomEventHandlers: TCustomEventHandlers = {
    ...customRealtimeEventHandlers,
    error: errorHandler,
  };

  // Get extended editor extensions configuration
  const extendedEditorProps = useExtendedEditorProps({
    workspaceSlug,
    page,
    storeType,
    fetchEntity: handlers.fetchEntity,
    getRedirectionLink: handlers.getRedirectionLink,
    extensionHandlers: editorExtensionHandlers,
    projectId,
  });

  const handleRestoreVersion = useCallback(
    async (descriptionHTML: string) => {
      editorRef.current?.clearEditor();
      editorRef.current?.setEditorValue(descriptionHTML);
    },
    [editorRef]
  );

  // reset editor ref on unmount
  useEffect(
    () => () => {
      setEditorRef(null);
    },
    [setEditorRef]
  );

  return (
    <div className="relative size-full overflow-hidden flex transition-all duration-300 ease-in-out">
      <div className="size-full flex flex-col overflow-hidden">
        <PageVersionsOverlay
          editorComponent={PagesVersionEditor}
          fetchVersionDetails={handlers.fetchVersionDetails}
          handleRestore={handleRestoreVersion}
          pageId={page.id ?? ""}
          restoreEnabled={isContentEditable}
          storeType={storeType}
        />
        <PageEditorToolbarRoot
          handleOpenNavigationPane={handleOpenNavigationPane}
          isNavigationPaneOpen={isNavigationPaneOpen}
          page={page}
        />
        {showContentTooLargeBanner && <ContentLimitBanner className="px-page-x" />}
        <PageEditorBody
          config={config}
          customRealtimeEventHandlers={mergedCustomEventHandlers}
          editorReady={editorReady}
          editorForwardRef={editorRef}
          handleEditorReady={handleEditorReady}
          handleOpenNavigationPane={handleOpenNavigationPane}
          handlers={handlers}
          isNavigationPaneOpen={isNavigationPaneOpen}
          page={page}
          projectId={projectId}
          storeType={storeType}
          webhookConnectionParams={webhookConnectionParams}
          workspaceSlug={workspaceSlug}
          extendedEditorProps={extendedEditorProps}
          isFetchingFallbackBinary={isFetchingFallbackBinary}
          onCollaborationStateChange={setCollaborationState}
        />
      </div>
      <PageNavigationPaneRoot
        storeType={storeType}
        handleClose={handleCloseNavigationPane}
        isNavigationPaneOpen={isNavigationPaneOpen}
        page={page}
        versionHistory={{
          fetchAllVersions: handlers.fetchAllVersions,
          fetchVersionDetails: handlers.fetchVersionDetails,
        }}
        extensions={navigationPaneExtensions}
      />
      <PageModals page={page} storeType={storeType} />
    </div>
  );
});
