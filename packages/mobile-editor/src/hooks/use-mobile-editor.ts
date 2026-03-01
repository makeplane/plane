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

import type React from "react";
import { useCallback, useEffect } from "react";
// types
import type { EditorRefApi, TCommandWithPropsWithItemKey, TEditorCommands } from "@plane/editor";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// types
import type { TOnEditorFocusProps, TScrollIntoViewProps } from "@/types";

export const useMobileEditor = (editorRef: React.MutableRefObject<EditorRefApi | null>) => {
  const setEditorValue = useCallback(
    (content: string) => {
      editorRef.current?.setEditorValue(content);
    },
    [editorRef]
  );

  /**
   * @returns the current content of the editor in HTML & binary format.
   */
  const sendContent = useCallback(() => {
    const editorDocument = editorRef.current?.getDocument();
    return editorDocument?.html;
  }, [editorRef]);

  // Executes the action based on the action key.
  const executeAction = useCallback(
    (props: TCommandWithPropsWithItemKey<TEditorCommands>) => editorRef.current?.executeMenuItemCommand(props),
    [editorRef]
  );

  /**
   * @description Set the link of the selected node.
   * @param link - The link to be set.
   * @param text - The text to be set for the link.
   */
  const setLink = useCallback(
    (link: string, text?: string) =>
      editorRef?.current?.executeMenuItemCommand<"link">({
        itemKey: "link",
        url: link,
        text: text,
      }),
    [editorRef]
  );

  const insertMathEquation = useCallback(
    (commandKey: "inline-equation" | "block-equation", latex: string) => {
      editorRef.current?.executeMenuItemCommand<"inline-equation" | "block-equation">({
        itemKey: commandKey,
        latex,
      });
    },
    [editorRef]
  );

  const createSelectionAtCursorPosition = useCallback(
    () => editorRef.current?.createSelectionAtCursorPosition(),
    [editorRef]
  );

  /**
   * @description Unfocus the editor.
   * @usecase This is required to remove the focus from the editor when the user taps outside the editor.
   */
  const unfocus = useCallback(() => editorRef.current?.blur(), [editorRef]);

  /**
   * @description Focus the editor.
   * @usecase This is required to focus the editor when the user taps on the editor.
   */
  const focus = useCallback(() => editorRef.current?.focus("start"), [editorRef]);

  // Scrolls to the focused node in the editor.
  const scrollToFocus = useCallback(
    (scrollPos?: number) =>
      editorRef.current?.scrollToNodeViaDOMCoordinates({
        behavior: "instant",
        pos: scrollPos,
      }),
    [editorRef]
  );

  /**
   * @description when the editor is ready, call the native code to notify that the editor is ready.
   * @param isReady - boolean
   */
  const handleEditorReady = useCallback((isReady: boolean) => {
    if (isReady) {
      void callNative(CallbackHandlerStrings.onEditorReady);
    }
  }, []);

  const undo = useCallback(() => editorRef.current?.undo(), [editorRef]);

  const redo = useCallback(() => editorRef.current?.redo(), [editorRef]);

  /**
   * @description Returns the link of the selected node, if any.
   */
  const getSelectedNodeLink = useCallback(
    () => editorRef.current?.getAttributesWithExtendedMark("link", "link")?.href as string | undefined,
    [editorRef]
  );

  const getSelectedText = useCallback(() => editorRef.current?.getSelectedText(), [editorRef]);

  const scrollIntoView = useCallback(
    ({ scrollBehavior = "smooth", extraPadding = 0, scrollMargin = 60 }: TScrollIntoViewProps) => {
      const handleScroll = () => {
        const cursorCoords = editorRef.current?.getCoordsFromPos();
        if (!cursorCoords) return;
        const element = document.getElementById("mobile-editor-container");
        if (!element) return;
        // Use visual viewport for more accurate keyboard detection
        const currentViewportHeight = window.visualViewport?.height || window.innerHeight;
        const initialViewportHeight = window.screen.height;
        const keyboardHeight = initialViewportHeight - currentViewportHeight;

        const threshold = 150;

        if (keyboardHeight < threshold) return;

        const availableHeight = currentViewportHeight - scrollMargin;
        const targetY =
          cursorCoords.bottom >= availableHeight
            ? cursorCoords.bottom - availableHeight + extraPadding
            : cursorCoords.bottom < 100
              ? -50
              : 0;
        element.scrollBy({
          top: targetY,
          behavior: scrollBehavior,
        });
      };

      // Android-specific: Listen for viewport changes for more responsive detection
      if (/Android/i.test(navigator.userAgent)) return;
      // Fallback for IOS
      setTimeout(() => handleScroll(), 100);
    },
    [editorRef]
  );

  // Notifies the native code that the editor is focused.
  const onEditorFocus = useCallback(
    ({ variant, scrollIntoView: shouldScrollIntoView = true }: TOnEditorFocusProps) => {
      void callNative(CallbackHandlerStrings.onEditorFocused);
      if (/Android/i.test(navigator.userAgent)) return;
      if (shouldScrollIntoView) {
        scrollIntoView({
          extraPadding: 20,
          scrollBehavior: "smooth",
          variant,
        });
      }
    },
    [scrollIntoView]
  );

  const resolveCommentMark = useCallback(
    (commentId: string) => editorRef.current?.resolveCommentMark(commentId),
    [editorRef]
  );

  const unresolveCommentMark = useCallback(
    (commentId: string) => editorRef.current?.unresolveCommentMark(commentId),
    [editorRef]
  );

  // Expose the functions to the window object.
  useEffect(() => {
    window.unfocus = unfocus;
    window.focus = focus;
    window.scrollToFocus = scrollToFocus;
    window.executeAction = executeAction;
    window.sendContent = sendContent;
    window.undo = undo;
    window.redo = redo;
    window.setLink = setLink;
    window.getSelectedNodeLink = getSelectedNodeLink;
    window.getSelectedText = getSelectedText;
    window.createSelectionAtCursorPosition = createSelectionAtCursorPosition;
    window.setEditorValue = setEditorValue;
    window.insertMathEquation = insertMathEquation;
    window.resolveCommentMark = resolveCommentMark;
    window.unresolveCommentMark = unresolveCommentMark;
  }, [
    unfocus,
    focus,
    scrollToFocus,
    executeAction,
    sendContent,
    undo,
    redo,
    setLink,
    getSelectedNodeLink,
    getSelectedText,
    createSelectionAtCursorPosition,
    setEditorValue,
    insertMathEquation,
    resolveCommentMark,
    unresolveCommentMark,
  ]);

  return {
    handleEditorReady,
    onEditorFocus,
    unfocus,
    scrollIntoView,
    resolveCommentMark,
  };
};
