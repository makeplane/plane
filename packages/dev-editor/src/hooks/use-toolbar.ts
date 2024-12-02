"use client";
import { useCallback } from "react";
import { TOOLBAR_ITEMS } from "../constants/editor";
import { EditorRefApi, TNonColorEditorCommands } from "@plane/editor";

export const useToolbar = (editorRef: React.MutableRefObject<EditorRefApi | null>) => {
  // Notifies the native code to with active toolbar state.
  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) {
      console.log("Editor ref is not available");
      return;
    }

    const newActiveStates: Record<string, boolean> = {};
    Object.values(TOOLBAR_ITEMS.document)
      .flat()
      .forEach((item) => {
        newActiveStates[item.key] =
          editorRef.current?.isMenuItemActive({
            itemKey: item.key as TNonColorEditorCommands,
          }) ?? false;
      });
    window.flutter_inappwebview?.callHandler("getActiveToolbarState", JSON.stringify(newActiveStates));
  }, []);

  return {
    updateActiveStates,
  };
};
