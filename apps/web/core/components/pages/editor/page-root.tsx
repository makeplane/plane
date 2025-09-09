import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TDocumentPayload, TPage, TPageVersion, TWebhookConnectionQueryParams } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageFallback } from "@/hooks/use-page-fallback";
import { useQueryParams } from "@/hooks/use-query-params";
import { type TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
// plane web import
import { PageModals } from "@/plane-web/components/pages";
import { usePagesPaneExtensions, useExtendedEditorProps } from "@/plane-web/hooks";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import {
  PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM,
  PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM,
  PageNavigationPaneRoot,
} from "../navigation-pane";
import { PageVersionsOverlay } from "../version";
import { PagesVersionEditor } from "../version/editor";
import { PageEditorBody, type TEditorBodyConfig, type TEditorBodyHandlers } from "./editor-body";
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

export const PageRoot = observer((props: TPageRootProps) => {
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
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // derived values
  const { isNestedPagesEnabled } = usePageStore(storeType);
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
  const { updateQueryParams } = useQueryParams();

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
  const { editorExtensionHandlers, navigationPaneExtensions, handleOpenNavigationPane, isNavigationPaneOpen } =
    usePagesPaneExtensions({
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

  const searchParams = useSearchParams();

  const version = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);

  const handleRestoreVersion = useCallback(
    async (descriptionHTML: string) => {
      if (version && isNestedPagesEnabled(workspaceSlug.toString())) {
        page.setVersionToBeRestored(version, descriptionHTML);
        page.setRestorationStatus(true);
        setToast({ id: "restoring-version", type: TOAST_TYPE.LOADING_TOAST, title: "Restoring version..." });
        if (page.id) {
          await handlers.restoreVersion(page.id, version);
        }
      } else {
        editorRef.current?.clearEditor();
        editorRef.current?.setEditorValue(descriptionHTML);
      }
    },
    [version, workspaceSlug, page, handlers, editorRef, isNestedPagesEnabled]
  );

  // reset editor ref on unmount
  useEffect(
    () => () => {
      setEditorRef(null);
    },
    [setEditorRef]
  );

  const handleCloseNavigationPane = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM, PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
    });
    router.push(updatedRoute);
  }, [router, updateQueryParams]);

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
          customRealtimeEventHandlers={customRealtimeEventHandlers}
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
