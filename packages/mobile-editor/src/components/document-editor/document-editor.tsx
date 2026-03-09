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

import { useEffect, useMemo, useRef, useState } from "react";
import { CollaborativeDocumentEditorWithRef, TrailingNode, EnterKeyExtension } from "@plane/editor";
import type { EditorRefApi, TDisplayConfig, TMentionHandler, TRealtimeConfig } from "@plane/editor";
// components
import { EditorMentionsRoot } from "@/components";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { EDITOR_PROPS } from "@/constants/editor";
// helpers
import { callNative, generateRandomColor, getEditorFileHandlers } from "@/helpers";
// hooks
import {
  useDisableZoom,
  useEditorEmbeds,
  useEditorFlagging,
  useEditorMentions,
  useMobileEditor,
  useRealtimePageEvents,
  useToolbar,
} from "@/hooks";
// store
import { useMentions, usePages } from "@/hooks/store";
// types
import type { TDocumentEditorParams } from "@/types/editor";
import { TEditorVariant } from "@/types/editor";
import { EditorScrollConfigWrapper } from "../editor/editor-scroll-config";

export const MobileDocumentEditor = () => {
  const [initialParams, setInitialParams] = useState<TDocumentEditorParams | undefined>();
  // hooks
  const {
    document: { flagged: flaggedExtensions, disabled: disabledExtensions },
  } = useEditorFlagging();

  const editorRef = useRef<EditorRefApi>(null);
  // It disables zooming in the editor.
  useDisableZoom();
  const { updatePageProperties, isEditable } = useRealtimePageEvents({
    currentPageId: initialParams?.pageId ?? "",
    currentProjectId: initialParams?.projectId,
    currentUserId: initialParams?.currentUserId ?? "",
    editorRef,
  });
  // It keeps the native toolbar in sync with the editor state.
  const { updateActiveStates } = useToolbar(editorRef);
  const { handleEditorReady, onEditorFocus, scrollIntoView } = useMobileEditor(editorRef);
  const { getMentionSuggestions } = useEditorMentions();
  const { getMentionDetails, fetchAllMentions, getMemberById } = useMentions();
  const { fetchPages: fetchSubPages } = usePages();
  const { embedHandler } = useEditorEmbeds({
    initialParams,
    isIssueEmbedEnabled: !flaggedExtensions.includes("issue-embed"),
    isNestedPagesEnabled: !flaggedExtensions.includes("nested-pages"),
  });

  const fileHandler = useMemo(() => getEditorFileHandlers(), []);

  const displayConfig: TDisplayConfig = {
    fontSize: "mobile-font",
    fontStyle: "sans-serif",
    lineSpacing: "mobile-regular",
  };

  const realtimeConfig: TRealtimeConfig | undefined = useMemo(() => {
    if (!initialParams) return undefined;
    // Construct the WebSocket Collaboration URL
    try {
      const LIVE_SERVER_BASE_URL = initialParams?.liveServerUrl.trim();
      const WS_LIVE_URL = new URL(LIVE_SERVER_BASE_URL);
      const isSecureEnvironment = initialParams?.liveServerUrl.startsWith("https");
      WS_LIVE_URL.protocol = isSecureEnvironment ? "wss" : "ws";
      WS_LIVE_URL.pathname = `${initialParams?.liveServerBasePath}/collaboration`;
      // Construct realtime config

      // Append query parameters to the URL
      Object.entries({
        workspaceSlug: initialParams?.workspaceSlug,
        documentType: initialParams?.documentType,
        projectId: initialParams?.projectId,
        pageId: initialParams?.pageId,
        parentPageId: initialParams?.parentPageId,
      })
        .filter(([_, value]) => value !== undefined && value !== null)
        .forEach(([key, value]) => {
          WS_LIVE_URL.searchParams.set(key, String(value));
        });

      // Construct realtime config
      return {
        url: WS_LIVE_URL.toString(),
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [initialParams]);

  const isAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);
  // Additional extensions for the editor.
  const externalExtensions = useMemo(
    () => [
      TrailingNode,
      EnterKeyExtension(() => {
        if (isAndroid) return;
        scrollIntoView({
          variant: TEditorVariant.document,
          scrollBehavior: "instant",
        });
      }),
    ],
    [scrollIntoView, isAndroid]
  );

  const mentionHandler: TMentionHandler = useMemo(
    () => ({
      searchCallback: async (query) => {
        const res = await getMentionSuggestions(query);
        if (!res) throw new Error("Failed in fetching mentions");
        return res;
      },
      getMentionedEntityDetails: (id: string) => ({ display_name: getMemberById(id)?.displayName ?? "" }),
      renderComponent: (props) =>
        initialParams && (
          <EditorMentionsRoot
            {...props}
            currentUserId={initialParams.currentUserId}
            workspaceSlug={initialParams.workspaceSlug}
            getMentionDetails={getMentionDetails}
          />
        ),
    }),
    [getMentionSuggestions, getMemberById, initialParams, getMentionDetails]
  );

  const userConfig = useMemo(
    () => ({
      id: initialParams?.currentUserId ?? "",
      cookie: initialParams?.cookie,
      name: initialParams?.userDisplayName ?? "",
      color: generateRandomColor(initialParams?.currentUserId ?? ""),
    }),
    [initialParams?.currentUserId, initialParams?.cookie, initialParams?.userDisplayName]
  );

  useEffect(() => {
    const fetchInitialParams = async () => {
      try {
        const params = await callNative<TDocumentEditorParams>(CallbackHandlerStrings.getInitialDocumentEditorParams);
        if (!params) return;
        setInitialParams(params);
        if (params?.pageId && !flaggedExtensions.includes("nested-pages")) void fetchSubPages(params.pageId);
        void fetchAllMentions();
      } catch (error) {
        console.error("Error getting initial document editor params", error);
      }
    };
    void fetchInitialParams();
    // It should only run once, to fetch the initial params
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [flaggedExtensions]);

  if (!realtimeConfig || !initialParams || !disabledExtensions) return null;

  return (
    <EditorScrollConfigWrapper editorRef={editorRef}>
      <CollaborativeDocumentEditorWithRef
        autofocus={false}
        bubbleMenuEnabled={false}
        containerClassName="min-h-screen py-4 !pb-32"
        editorClassName="!px-5"
        disabledExtensions={disabledExtensions}
        displayConfig={displayConfig}
        editable={isEditable ?? initialParams?.editable ?? false}
        editorProps={isAndroid ? EDITOR_PROPS : undefined}
        extendedDocumentEditorProps={{
          isSelfHosted: initialParams?.isSelfHosted ?? false,
          onTitleFocus: () => void callNative(CallbackHandlerStrings.onPageTitleTap),
          titleContainerClassName: "px-4 pt-2",
        }}
        getEditorMetaData={() => ({
          user_mentions: [],
          file_assets: [],
        })}
        extendedEditorProps={{
          isSmoothCursorEnabled: false,
          extensionOptions: {
            mathematics: {
              onClick: (nodeAttrs, updateEquation) => {
                void (async () => {
                  const updatedLatex = await callNative<string>(
                    CallbackHandlerStrings.updateMathEquation,
                    String(nodeAttrs.latex ?? "")
                  );
                  if (!updatedLatex) return;
                  updateEquation(updatedLatex);
                })();
              },
            },
            attachmentComponent: {
              onClick: (source) => {
                void callNative(CallbackHandlerStrings.onAttachmentBlockClick, String(source ?? ""));
              },
            },
            externalEmbedComponent: {
              onClick: () => {
                void callNative(CallbackHandlerStrings.onExternalEmbedBlockClick);
              },
            },
            drawIoComponent: {
              onClick: () => {
                void callNative(CallbackHandlerStrings.onDrawioBlockClick);
              },
            },
          },
          commentConfig: {
            onClick({ commentIds, primaryCommentId, referenceParagraph }) {
              editorRef.current?.blur();
              void callNative(
                CallbackHandlerStrings.onCommentClick,
                JSON.stringify({ primaryCommentId, commentIds, referenceParagraph })
              );
            },
          },
          embedHandler,
        }}
        extensions={externalExtensions}
        fileHandler={fileHandler}
        flaggedExtensions={flaggedExtensions}
        handleEditorReady={handleEditorReady}
        id={initialParams?.pageId}
        dragDropEnabled={false}
        isTouchDevice
        documentLoaderClassName="px-4"
        mentionHandler={mentionHandler}
        onEditorFocus={() => {
          const resolvedIsEditable = isEditable ?? initialParams?.editable ?? false;
          if (!resolvedIsEditable) return;
          onEditorFocus({ variant: TEditorVariant.document });
        }}
        onTransaction={() => {
          updateActiveStates();
        }}
        placeholder={"Write something..."}
        realtimeConfig={realtimeConfig}
        ref={editorRef}
        updatePageProperties={updatePageProperties}
        user={userConfig}
        serverHandler={{
          onStateChange: () => {},
        }}
      />
    </EditorScrollConfigWrapper>
  );
};
