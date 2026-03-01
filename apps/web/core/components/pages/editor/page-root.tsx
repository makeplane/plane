/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import type { CollaborationState, EditorRefApi } from "@plane/editor";
import { TOAST_TYPE, updateToast } from "@plane/propel/toast";
import type { TDocumentPayload, TPage, TPageVersion, TWebhookConnectionQueryParams } from "@plane/types";
// hooks
import { usePageFallback } from "@/hooks/use-page-fallback";
// plane web import
import type { PageUpdateHandler, TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
import { PageModals } from "@/plane-web/components/pages";
import { NestedPagesDownloadBanner } from "@/components/wiki/nested-pages-download-banner";
import { useExtendedEditorProps, usePagesPaneExtensions } from "@/plane-web/hooks/pages";
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM, PageNavigationPaneRoot } from "../navigation-pane";
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
  const [isGeneratingPageSummary, setIsGeneratingPageSummary] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { isNestedPagesEnabled: getIsNestedPagesEnabled } = usePageStore(storeType);
  // derived values
  const {
    isContentEditable,
    editor: { setEditorRef },
    fetchEmbedsAndMentions,
  } = page;
  const isNestedPagesEnabled = getIsNestedPagesEnabled(workspaceSlug);
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
  // init editor ref
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

  // Merge custom event handlers with content too large handler
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
  // version history
  const searchParams = useSearchParams();
  const version = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);
  const handleRestoreVersion = useCallback(
    async (descriptionJSON: object) => {
      if (version && isNestedPagesEnabled) {
        page.setVersionToBeRestored(version, descriptionJSON);
        page.setRestorationStatus(true);
        updateToast("restoring-version", { type: TOAST_TYPE.LOADING_TOAST, title: "Restoring version..." });
        if (page.id) {
          await handlers.restoreVersion(page.id, version);
        }
      } else {
        editorRef.current?.clearEditor();
        editorRef.current?.setEditorValue(descriptionJSON);
      }
    },
    [version, page, handlers, editorRef, isNestedPagesEnabled]
  );
  // cleanup
  useEffect(
    () => () => {
      setEditorRef(null);
    },
    [setEditorRef]
  );
  // fetch embeds and mentions
  useSWR(page.id ? `PAGE_EMBEDS_AND_MENTIONS_${page.id}` : null, page.id ? fetchEmbedsAndMentions : null);

  return (
    <div className="relative size-full overflow-hidden flex transition-all duration-300 ease-in-out">
      <div className="size-full flex flex-col overflow-hidden">
        <PageVersionsOverlay
          editorComponent={PagesVersionEditor}
          fetchAllVersions={handlers.fetchAllVersions}
          handleRestore={handleRestoreVersion}
          pageId={page.id ?? ""}
          restoreEnabled={isContentEditable}
          storeType={storeType}
        />
        <NestedPagesDownloadBanner page={page} storeType={storeType} workspaceSlug={workspaceSlug} />
        {showContentTooLargeBanner && <ContentLimitBanner className="px-page-x" />}
        <div className="shrink-0 relative size-full flex flex-col overflow-hidden">
          <PageEditorToolbarRoot
            isGeneratingPageSummary={isGeneratingPageSummary}
            handleOpenNavigationPane={handleOpenNavigationPane}
            isNavigationPaneOpen={isNavigationPaneOpen}
            page={page}
            storeType={storeType}
            setIsGeneratingPageSummary={setIsGeneratingPageSummary}
          />
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
            isGeneratingPageSummary={isGeneratingPageSummary}
            setIsGeneratingPageSummary={setIsGeneratingPageSummary}
          />
        </div>
      </div>
      <PageNavigationPaneRoot
        config={config}
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
