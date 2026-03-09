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

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useDrawioAwareness } from "../hooks/use-awareness";
import { useDrawioMessageHandler } from "../hooks/use-drawio-message-handler";
// types
import { EDrawioAttributeNames, EDrawioMode } from "../types";
// constants
import { DRAWIO_DIAGRAM_URL, DRAWIO_BOARD_URL } from "../utils/constants";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// components
import type { DrawioIframeRef } from "./iframe";
import { DrawioIframe } from "./iframe";
import { DrawioInputBlock } from "./input-block";
import { DrawioIframeLoading } from "./loading";
import type { DrawioNodeViewProps } from "./node-view";
import { DrawioDialogWrapper } from "./wrapper";

export const DrawioBlock = memo(function DrawioBlock(props: DrawioNodeViewProps) {
  const { node, updateAttributes, editor, selected, extension } = props;
  const { getFileContent, isFlagged, onClick, logoSpinner } = extension.options;

  // state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerXmlContent, setViewerXmlContent] = useState<string | null>(null);
  const [isLoadingViewer, setIsLoadingViewer] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const [hasViewerError, setHasViewerError] = useState(false);

  // refs
  const iframeRef = useRef<DrawioIframeRef>(null);

  // attributes
  const diagramId = node.attrs[EDrawioAttributeNames.ID];
  const imageSrc = node.attrs[EDrawioAttributeNames.IMAGE_SRC];
  const xmlSrc = node.attrs[EDrawioAttributeNames.XML_SRC];
  const mode = node.attrs[EDrawioAttributeNames.MODE];

  // hooks
  const { userEditingThisDiagram, setEditingState, handleBlockedClick, broadcastSave, lastRemoteSave } =
    useDrawioAwareness(editor, diagramId || null);

  // Build viewer blob URL from XML content to avoid URL length limits.
  // Uses a Blob HTML page that loads the diagrams.net viewer-static.min.js
  // and initializes it via data-mxgraph attribute.
  const viewerBlobUrl = useRef<string | null>(null);
  const viewerUrl = (() => {
    if (viewerBlobUrl.current) {
      URL.revokeObjectURL(viewerBlobUrl.current);
      viewerBlobUrl.current = null;
    }
    if (!viewerXmlContent) return null;
    const mxgraphJson = JSON.stringify({
      highlight: "#0000ff",
      lightbox: false,
      nav: true,
      resize: true,
      xml: viewerXmlContent,
    });
    const htmlSafeJson = mxgraphJson
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>body{margin:0;overflow:hidden}</style></head>
<body><div class="mxgraph" style="max-width:100%" data-mxgraph="${htmlSafeJson}"></div>
<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    viewerBlobUrl.current = URL.createObjectURL(blob);
    return viewerBlobUrl.current;
  })();

  // Clean up blob URL on unmount
  useEffect(
    () => () => {
      if (viewerBlobUrl.current) URL.revokeObjectURL(viewerBlobUrl.current);
    },
    []
  );

  // Fetch XML content for the viewer iframe
  const loadViewerXml = useCallback(async () => {
    if (!xmlSrc || !getFileContent) {
      setViewerXmlContent(null);
      return;
    }

    setIsLoadingViewer(true);
    setHasViewerError(false);
    try {
      const xml = await getFileContent(xmlSrc);
      setViewerXmlContent(xml);
      // Bump key to force iframe remount
      setViewerKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error loading XML for viewer:", error);
      setViewerXmlContent(null);
      setHasViewerError(true);
    } finally {
      setIsLoadingViewer(false);
    }
  }, [xmlSrc, getFileContent]);

  useEffect(() => {
    loadViewerXml();
  }, [loadViewerXml]);

  // Re-fetch viewer XML when a remote user saves this diagram (via awareness)
  useEffect(() => {
    if (lastRemoteSave) {
      loadViewerXml();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRemoteSave]);

  // Load XML content for editing modal
  const loadXmlContent = useCallback(async (): Promise<string> => {
    if (!xmlSrc || !getFileContent) return "";
    try {
      return await getFileContent(xmlSrc);
    } catch (error) {
      console.error("Error loading XML content:", error);
      return "";
    }
  }, [xmlSrc, getFileContent]);

  const handleCloseModal = useCallback(() => {
    setEditingState(false);
    setIsModalOpen(false);
    setIsLoading(false);
  }, [setEditingState]);

  // Auto-open modal if openDialog flag is set (when inserted via slash command)
  useEffect(() => {
    const drawioStorage = editor.storage[ADDITIONAL_EXTENSIONS.DRAWIO];
    const isEmpty = !xmlSrc;

    if (drawioStorage?.openDialog && isEmpty && editor.isEditable && !isFlagged) {
      drawioStorage.openDialog = false;
      setEditingState(true);
      setIsModalOpen(true);
      setIsLoading(true);
    }
  }, [editor, xmlSrc, isFlagged, setEditingState, diagramId]);

  // Update viewer directly with saved XML, bump key, and notify peers
  const handleXmlSaved = useCallback(
    (xmlContent: string) => {
      setViewerXmlContent(xmlContent);
      setViewerKey((prev) => prev + 1);
      broadcastSave();
    },
    [broadcastSave]
  );

  // Message handler hook
  const { handleMessage } = useDrawioMessageHandler({
    diagramId: diagramId || undefined,
    imageSrc: imageSrc || undefined,
    xmlSrc: xmlSrc || undefined,
    iframeRef,
    loadXmlContent,
    handleCloseModal,
    setIsLoading,
    onXmlSaved: handleXmlSaved,
    updateAttributes,
    extension,
  });

  // Handle clicking on the diagram to edit
  const handleClick = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (!editor.isEditable || isFlagged) return;

      if (userEditingThisDiagram) {
        handleBlockedClick();
        return;
      }

      if (onClick) {
        onClick();
        return;
      }

      setEditingState(true);
      setIsModalOpen(true);
      setIsLoading(true);
    },
    [editor.isEditable, isFlagged, onClick, setEditingState, userEditingThisDiagram, handleBlockedClick]
  );

  return (
    <>
      <div className="relative">
        {/* Collaborative editing label */}
        {userEditingThisDiagram && (
          <div
            className="absolute z-20 rounded-sm px-2 py-1 text-11 font-medium text-black shadow-sm pointer-events-none whitespace-nowrap -top-[28px]"
            style={{ backgroundColor: userEditingThisDiagram.color }}
          >
            {userEditingThisDiagram.name} is editing
          </div>
        )}

        {userEditingThisDiagram && (
          <div
            className="absolute inset-0 pointer-events-none rounded-md animate-pulse z-[5]"
            style={{
              boxShadow: `0 0 0 2px ${userEditingThisDiagram.color}80, 0 0 8px ${userEditingThisDiagram.color}40`,
            }}
          />
        )}

        {/* Viewer iframe or empty state */}
        {viewerUrl ? (
          <>
            {isLoadingViewer && (
              <div className="p-0.5">
                <Loader>
                  <Loader.Item width="100%" height="200px" />
                </Loader>
              </div>
            )}
            <div
              className={cn("group/drawio-component relative", {
                hidden: isLoadingViewer,
                "cursor-not-allowed": editor.isEditable && userEditingThisDiagram,
                "cursor-pointer": editor.isEditable && !userEditingThisDiagram,
                "cursor-default": !editor.isEditable,
              })}
              onClick={handleClick}
            >
              <iframe
                key={viewerKey}
                src={viewerUrl}
                className={cn(
                  "w-full h-[400px] rounded-md border border-subtle-1 max-w-full pointer-events-none relative z-0 transition-all duration-150 ease-in-out",
                  {
                    "opacity-50": userEditingThisDiagram,
                  }
                )}
                title="Drawio diagram"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
              {/* Click & hover overlay (z-10 sits above the pointer-events-none iframe) */}
              <div
                className={cn(
                  "absolute inset-0 z-10 rounded-md transition-all duration-150 ease-in-out",
                  {
                    "cursor-not-allowed": editor.isEditable && userEditingThisDiagram,
                    "cursor-pointer": editor.isEditable && !userEditingThisDiagram,
                    "cursor-default": !editor.isEditable,
                  },
                  editor.isEditable && !userEditingThisDiagram
                    ? "group-hover/drawio-component:border-2 group-hover/drawio-component:border-accent-strong group-hover/drawio-component:bg-accent-primary/5"
                    : ""
                )}
              />
              {/* Selection overlay */}
              {selected && (
                <div className="absolute inset-0 size-full bg-accent-primary/30 pointer-events-none rounded-md" />
              )}
            </div>
          </>
        ) : hasViewerError ? (
          <div className="flex items-center justify-center h-[200px] rounded-md border border-subtle-1 bg-custom-background-90">
            <p className="text-sm text-custom-text-300">Failed to load diagram.</p>
          </div>
        ) : xmlSrc || isLoadingViewer ? (
          <div className="p-0.5">
            <Loader>
              <Loader.Item width="100%" height="200px" />
            </Loader>
          </div>
        ) : (
          <DrawioInputBlock
            selected={selected}
            isEditable={editor.isEditable}
            handleDrawioButtonClick={handleClick}
            mode={mode}
            isFlagged={isFlagged}
          />
        )}
      </div>

      <DrawioDialogWrapper isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="relative w-full h-full">
          <DrawioIframe
            ref={iframeRef}
            src={mode === EDrawioMode.BOARD ? DRAWIO_BOARD_URL : DRAWIO_DIAGRAM_URL}
            onMessage={handleMessage}
            isVisible={!isLoading}
          />
          {isLoading && <DrawioIframeLoading LoadingComponent={logoSpinner} />}
        </div>
      </DrawioDialogWrapper>
    </>
  );
});
