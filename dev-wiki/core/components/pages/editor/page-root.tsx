import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import { TDocumentPayload, TPage, TPageVersion, TWebhookConnectionQueryParams } from "@plane/types";
// components
import { setToast, TOAST_TYPE } from "@plane/ui";
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
// types
import { TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store/use-page-store";
// services
import { WorkspacePageVersionService } from "@/plane-web/services/page";
// store
import { TPageInstance } from "@/store/pages/base-page";

export type TPageRootHandlers = {
  create: (payload: Partial<TPage>) => Promise<Partial<TPage> | undefined>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  fetchDescriptionBinary: () => Promise<any>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
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

const workspacePageVersionService = new WorkspacePageVersionService();

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
  const [isVersionsOverlayOpen, setIsVersionsOverlayOpen] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // search params
  const searchParams = useSearchParams();
  // derived values
  const { isNestedPagesEnabled } = usePageStore(storeType);
  const { isContentEditable, setEditorRef } = page;
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
      if (editorRef.current && !page.editorRef) {
        setEditorRef(editorRef.current);
      }
    },
    [page.editorRef, setEditorRef]
  );

  useEffect(() => {
    setTimeout(() => {
      setEditorRef(editorRef.current);
    }, 0);
  }, [isContentEditable, setEditorRef]);

  const version = searchParams.get("version");
  useEffect(() => {
    if (!version) {
      setIsVersionsOverlayOpen(false);
      return;
    }
    setIsVersionsOverlayOpen(true);
  }, [version]);

  const handleCloseVersionsOverlay = () => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: ["version"],
    });
    router.push(updatedRoute);
  };

  const handleRestoreVersion = async (descriptionHTML: string) => {
    if (version && isNestedPagesEnabled(workspaceSlug?.toString())) {
      page.setVersionToBeRestored(version, descriptionHTML);
      page.setRestorationStatus(true);
      setToast({ id: "restoring-version", type: TOAST_TYPE.LOADING_TOAST, title: "Restoring version..." });
      await workspacePageVersionService.restoreVersion(workspaceSlug, page.id ?? "", version ?? "");
    } else {
      editorRef.current?.clearEditor();
      editorRef.current?.setEditorValue(descriptionHTML);
    }
  };
  const currentVersionDescription = editorRef.current?.getDocument().html;

  // reset editor ref on unmount
  useEffect(
    () => () => {
      setEditorRef(null);
    },
    [setEditorRef]
  );

  return (
    <>
      <PageVersionsOverlay
        activeVersion={version}
        currentVersionDescription={currentVersionDescription ?? null}
        editorComponent={PagesVersionEditor}
        fetchAllVersions={handlers.fetchAllVersions}
        fetchVersionDetails={handlers.fetchVersionDetails}
        handleRestore={handleRestoreVersion}
        isOpen={isVersionsOverlayOpen}
        onClose={handleCloseVersionsOverlay}
        pageId={page.id ?? ""}
        restoreEnabled={isContentEditable}
        storeType={storeType}
      />
      <PageEditorToolbarRoot page={page} storeType={storeType} />
      <PageEditorBody
        config={config}
        storeType={storeType}
        editorReady={editorReady}
        editorForwardRef={editorRef}
        handleConnectionStatus={setHasConnectionFailed}
        handleEditorReady={handleEditorReady}
        handlers={handlers}
        page={page}
        projectId={projectId}
        webhookConnectionParams={webhookConnectionParams}
        workspaceSlug={workspaceSlug}
        customRealtimeEventHandlers={customRealtimeEventHandlers}
      />
    </>
  );
});
