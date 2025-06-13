import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { TDocumentPayload, TPage, TPageVersion, TWebhookConnectionQueryParams } from "@plane/types";
// components
import {
  PageEditorToolbarRoot,
  PageEditorBody,
  PageVersionsOverlay,
  PagesVersionEditor,
  TEditorBodyHandlers,
  TEditorBodyConfig,
} from "@/components/pages";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageFallback } from "@/hooks/use-page-fallback";
import { useQueryParams } from "@/hooks/use-query-params";
// plane web import
import { TPageNavigationPaneTab } from "@/plane-web/components/pages/navigation-pane";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import {
  PAGE_NAVIGATION_PANE_TAB_KEYS,
  PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM,
  PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM,
  PageNavigationPaneRoot,
} from "../navigation-pane";

export type TPageRootHandlers = {
  create: (payload: Partial<TPage>) => Promise<Partial<TPage> | undefined>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  fetchDescriptionBinary: () => Promise<any>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  getRedirectionLink: (pageId: string) => string;
  updateDescription: (document: TDocumentPayload) => Promise<void>;
} & TEditorBodyHandlers;

export type TPageRootConfig = TEditorBodyConfig;

type TPageRootProps = {
  config: TPageRootConfig;
  handlers: TPageRootHandlers;
  page: TPageInstance;
  webhookConnectionParams: TWebhookConnectionQueryParams;
  workspaceSlug: string;
};

export const PageRoot = observer((props: TPageRootProps) => {
  const { config, handlers, page, webhookConnectionParams, workspaceSlug } = props;
  // states
  const [editorReady, setEditorReady] = useState(false);
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // search params
  const searchParams = useSearchParams();
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
  // update query params
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

  const handleRestoreVersion = useCallback(async (descriptionHTML: string) => {
    editorRef.current?.clearEditor();
    editorRef.current?.setEditorValue(descriptionHTML);
  }, []);

  // reset editor ref on unmount
  useEffect(
    () => () => {
      setEditorRef(null);
    },
    [setEditorRef]
  );

  const navigationPaneQueryParam = searchParams.get(
    PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM
  ) as TPageNavigationPaneTab | null;
  const isValidNavigationPaneTab =
    !!navigationPaneQueryParam && PAGE_NAVIGATION_PANE_TAB_KEYS.includes(navigationPaneQueryParam);

  const handleOpenNavigationPane = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: "outline" },
    });
    router.push(updatedRoute);
  }, [router, updateQueryParams]);

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
        />
        <PageEditorToolbarRoot
          handleOpenNavigationPane={handleOpenNavigationPane}
          isNavigationPaneOpen={isValidNavigationPaneTab}
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
          isNavigationPaneOpen={isValidNavigationPaneTab}
          page={page}
          webhookConnectionParams={webhookConnectionParams}
          workspaceSlug={workspaceSlug}
        />
      </div>
      <PageNavigationPaneRoot
        handleClose={handleCloseNavigationPane}
        isNavigationPaneOpen={isValidNavigationPaneTab}
        page={page}
        versionHistory={{
          fetchAllVersions: handlers.fetchAllVersions,
          fetchVersionDetails: handlers.fetchVersionDetails,
        }}
      />
    </div>
  );
});
