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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorRefApi, TDisplayConfig, TMentionHandler, IEditorProps } from "@plane/editor";
import { RichTextEditorWithRef, TrailingNode } from "@plane/editor";
// components
import { EditorMentionsRoot, EditorScrollConfigWrapper, MobileLiteTextEditor } from "@/components";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { EDITOR_PROPS } from "@/constants/editor";
// helpers
import {
  callNative,
  disconnectContentSizeObserver,
  getEditorFileHandlers,
  initializeContentSizeObserver,
} from "@/helpers";
// hooks
import {
  useDisableZoom,
  useEditorEmbeds,
  useEditorFlagging,
  useEditorMentions,
  useInitialContentLoad,
  useMobileEditor,
  useToolbar,
} from "@/hooks";
// hooks
import { useMentions } from "@/hooks/store";
// types
import type { TEditorParams } from "@/types/editor";
import { TEditorVariant } from "@/types/editor";

export const EditorWrapper = ({ variant }: { variant: TEditorVariant }) => {
  const editorRef = useRef<EditorRefApi>(null);
  const [initialParams, setInitialParams] = useState<TEditorParams | undefined>();
  const [isEditorReady, setIsEditorReady] = useState(false);
  // It is a custom hook that disables zooming in the editor.
  useDisableZoom();
  // It keeps the native toolbar in sync with the editor state.
  const { updateActiveStates } = useToolbar(editorRef);
  const { handleEditorReady, onEditorFocus, scrollIntoView } = useMobileEditor(editorRef);
  const { getMentionSuggestions } = useEditorMentions();
  const { getMentionDetails } = useMentions();
  const {
    document: { flagged: flaggedExtensions, disabled: disabledExtensions },
  } = useEditorFlagging();
  const { embedHandler } = useEditorEmbeds({
    initialParams,
    isIssueEmbedEnabled: !flaggedExtensions.includes("issue-embed"),
    isNestedPagesEnabled: !flaggedExtensions.includes("nested-pages"),
  });
  const { onInitialContentLoad } = useInitialContentLoad(isEditorReady);
  const fileHandler = useMemo(() => getEditorFileHandlers(), []);

  // This is called by the native code to reset the initial params of the editor.
  const resetInitialParams = useCallback((params: TEditorParams) => {
    setInitialParams(params);
  }, []);

  // This is called when the editor is ready to get the initial params from the native code.
  useEffect(() => {
    const fetchInitialParams = async () => {
      try {
        const params = await callNative<TEditorParams>(CallbackHandlerStrings.getInitialEditorParams);
        if (!params) return;
        setInitialParams(params);
      } catch (error) {
        console.error("Failed to fetch initial editor params", error);
      }
    };

    void fetchInitialParams();
  }, []);

  // Additional extensions for the editor.
  const externalExtensions: IEditorProps["extensions"] = useMemo(() => [TrailingNode], []);

  useEffect(() => {
    window.resetInitialParams = resetInitialParams;
  }, [resetInitialParams]);

  const mentionHandler: TMentionHandler = useMemo(
    () =>
      variant !== TEditorVariant.sticky
        ? {
            searchCallback: async (query) => {
              const res = await getMentionSuggestions(query);
              if (!res) throw new Error("Failed in fetching mentions");
              return res;
            },
            renderComponent: (props) =>
              initialParams && (
                <EditorMentionsRoot
                  {...props}
                  currentUserId={initialParams.currentUserId}
                  workspaceSlug={initialParams.workspaceSlug ?? ""}
                  getMentionDetails={getMentionDetails}
                />
              ),
          }
        : ({} as TMentionHandler),
    [getMentionSuggestions, initialParams, variant, getMentionDetails]
  );

  const displayConfig: TDisplayConfig = {
    lineSpacing: "mobile-regular",
    fontSize: "mobile-font",
  };

  const isDependencyReady = !useMemo(() => !initialParams, [initialParams]);
  const isAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);

  useEffect(() => {
    initializeContentSizeObserver();
    return () => {
      disconnectContentSizeObserver();
    };
  }, []);

  if (!isDependencyReady) return null;

  if (variant !== TEditorVariant.rich) {
    return (
      <MobileLiteTextEditor
        displayConfig={displayConfig}
        editorRef={editorRef}
        initialParams={initialParams as TEditorParams}
        externalExtensions={externalExtensions}
        fileHandler={fileHandler}
        handleEditorReady={handleEditorReady}
        mentionHandler={mentionHandler}
        onEditorFocus={onEditorFocus}
        updateActiveStates={updateActiveStates}
        variant={variant}
        scrollIntoView={scrollIntoView}
      />
    );
  }
  return (
    <EditorScrollConfigWrapper editorRef={editorRef}>
      {variant === TEditorVariant.rich && (
        <RichTextEditorWithRef
          autofocus={initialParams?.autoFocus ?? false}
          bubbleMenuEnabled={false}
          containerClassName="p-0 border-none !px-5"
          disabledExtensions={disabledExtensions}
          displayConfig={displayConfig}
          dragDropEnabled={false}
          editable={initialParams?.editable ?? false}
          editorClassName={initialParams?.editable === true ? "!pb-52" : ""}
          editorProps={
            isAndroid
              ? {
                  scrollMargin: initialParams?.scrollMargin ?? EDITOR_PROPS.scrollMargin,
                  scrollThreshold: EDITOR_PROPS.scrollThreshold,
                }
              : undefined
          }
          getEditorMetaData={() => ({
            user_mentions: [],
            file_assets: [],
          })}
          extensions={externalExtensions}
          extendedEditorProps={{
            isSmoothCursorEnabled: false,
            embedHandler,
            extensionOptions: {
              mathematics: {
                onClick: (nodeAttrs, updateEquation) => {
                  void (async () => {
                    const updatedLatex = await callNative<string>(
                      CallbackHandlerStrings.updateMathEquation,
                      nodeAttrs.latex
                    );
                    if (!updatedLatex) return;
                    updateEquation(updatedLatex);
                  })();
                },
              },
              attachmentComponent: {
                onClick: (source) => {
                  void callNative(CallbackHandlerStrings.onAttachmentBlockClick, source ?? "");
                },
              },
              externalEmbedComponent: {
                onClick: () => {
                  void callNative(CallbackHandlerStrings.onExternalEmbedBlockClick);
                },
              },
            },
          }}
          fileHandler={fileHandler}
          flaggedExtensions={[]}
          handleEditorReady={(value) => {
            setIsEditorReady(value);
            handleEditorReady(value);
          }}
          id="rich-editor"
          initialValue={initialParams?.content ?? "<p></p>"}
          isTouchDevice
          mentionHandler={mentionHandler}
          onChange={(_, html) => {
            void callNative(CallbackHandlerStrings.onContentChange, html);
          }}
          onEditorFocus={() => onEditorFocus({ variant })}
          onTransaction={() => {
            updateActiveStates();
            onInitialContentLoad();
            if (!isAndroid) {
              // Debounce the scroll into view to avoid excessive scrolling
              const timeoutId = setTimeout(() => {
                scrollIntoView({
                  variant,
                  scrollBehavior: "instant",
                  scrollMargin: initialParams?.scrollMargin,
                });
              }, 100); // 100ms debounce

              return () => clearTimeout(timeoutId);
            }
          }}
          placeholder={initialParams?.placeholder}
          ref={editorRef}
        />
      )}
    </EditorScrollConfigWrapper>
  );
};
