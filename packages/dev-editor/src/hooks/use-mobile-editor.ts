import React, { useCallback } from "react";
import { EditorRefApi, TNonColorEditorCommands } from "@plane/editor";

declare global {
  interface Window {
    sendHtmlContent: () => string;
    executeAction: (actionKey: TNonColorEditorCommands) => void;
    unfocus: () => void;
    scrollToFocus: () => void;
  }
}

export const useMobileEditor = (editorRef: React.MutableRefObject<EditorRefApi | null>) => {
  // Returns the current content of the editor in HTML format.
  function sendHtmlContent() {
    return editorRef.current?.getDocument().html ?? "";
  }

  // Notifies the native code that the editor is focused.
  const onEditorFocus = useCallback(() => window.flutter_inappwebview?.callHandler("onEditorFocused"), []);

  // Executes the action based on the action key.
  const executeAction = useCallback(
    (actionKey: TNonColorEditorCommands) => {
      editorRef.current?.executeMenuItemCommand({
        itemKey: actionKey,
      });
      editorRef.current?.scrollToPosition("instant");
    },
    [editorRef.current]
  );

  // Unfocus the editor.
  const unfocus = useCallback(() => editorRef.current?.blur(), [editorRef.current]);

  // scroll to current focus.
  const scrollToFocus = useCallback(() => editorRef.current?.scrollToPosition("instant"), [editorRef.current]);

  // when the editor is ready, call the native code to notify that the editor is ready.
  const handleEditorReady = useCallback((isReady: boolean) => {
    if (isReady) {
      window.flutter_inappwebview?.callHandler("onEditorReady");
    }
  }, []);

  window.unfocus = unfocus;
  window.scrollToFocus = scrollToFocus;
  window.executeAction = executeAction;
  window.sendHtmlContent = sendHtmlContent;

  return {
    handleEditorReady,
    onEditorFocus,
  };
};
