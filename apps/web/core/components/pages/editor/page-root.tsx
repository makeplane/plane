import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TDocumentPayload, TPage, TPageVersion, TWebhookConnectionQueryParams } from "@plane/types";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageFallback } from "@/hooks/use-page-fallback";
// plane web import
import { PageModals } from "@/plane-web/components/pages";
import { usePagesPaneExtensions, useExtendedEditorProps } from "@/plane-web/hooks/pages";
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneRoot } from "../navigation-pane";
import { PageVersionsOverlay } from "../version";
import { PagesVersionEditor } from "../version/editor";
import { PageEditorBody } from "./editor-body";
import type { TEditorBodyConfig, TEditorBodyHandlers } from "./editor-body";
import { PageEditorToolbarRoot } from "./toolbar";

export type TPageRootHandlers = {
  create: (payload: Partial<TPage>) => Promise<Partial<TPage> | undefined>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  fetchDescriptionBinary: () => Promise<any>;
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
  projectId: string;
  workspaceSlug: string;
};

export const PageRoot = observer((props: TPageRootProps) => {
  const { config, handlers, page, projectId, storeType, webhookConnectionParams, workspaceSlug } = props;
  // states
  const [editorReady, setEditorReady] = useState(false);
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // derived values
  const {
    isContentEditable,
    editor: { setEditorRef },
  } = page;
  // page fallback
  usePageFallback({
    editorRef,
    fetchPageDescription: handlers.fetchDescriptionBinary,
    hasConnectionFailed,
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
        <PageEditorBody
          config={config}
          editorReady={editorReady}
          editorForwardRef={editorRef}
          handleConnectionStatus={setHasConnectionFailed}
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
