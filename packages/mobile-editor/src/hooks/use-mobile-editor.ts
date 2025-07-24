import React, { useCallback } from "react";
import { EditorRefApi, TEditorCommands } from "@plane/editor";
import { callNative } from "@/helpers/flutter-callback.helper";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";

export const useMobileEditor = (editorRef: React.MutableRefObject<EditorRefApi | null>) => {
  /**
   * @returns the current content of the editor in HTML format.
   */
  const sendHtmlContent = useCallback(() => editorRef.current?.getDocument().html, [editorRef.current]);

  // Notifies the native code that the editor is focused.
  const onEditorFocus = useCallback(() => callNative(CallbackHandlerStrings.onEditorFocused), []);

  // Executes the action based on the action key.
  const executeAction = useCallback(
    (actionKey: TEditorCommands) => {
      // @ts-expect-error type mismatch here
      editorRef.current?.executeMenuItemCommand({
        itemKey: actionKey,
      });
      editorRef.current?.scrollToNodeViaDOMCoordinates("instant");
    },
    [editorRef.current]
  );

  /**
   * @description Unfocus the editor.
   * @usecase This is required to remove the focus from the editor when the user taps outside the editor.
   */
  const unfocus = useCallback(() => editorRef.current?.blur(), [editorRef.current]);

  // Scrolls to the focused node in the editor.
  const scrollToFocus = useCallback(
    () => editorRef.current?.scrollToNodeViaDOMCoordinates("instant"),
    [editorRef.current]
  );

  /**
   * @description when the editor is ready, call the native code to notify that the editor is ready.
   * @param isReady - boolean
   */
  const handleEditorReady = useCallback((isReady: boolean) => {
    if (isReady) {
      callNative(CallbackHandlerStrings.onEditorReady);
    }
  }, []);

  // Expose the functions to the window object.
  window.unfocus = unfocus;
  window.scrollToFocus = scrollToFocus;
  window.executeAction = executeAction;
  window.sendHtmlContent = sendHtmlContent;

  return {
    handleEditorReady,
    onEditorFocus,
  };
};
