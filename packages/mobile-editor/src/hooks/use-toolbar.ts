"use client";
import { useCallback } from "react";
import { TOOLBAR_ITEMS } from "@/constants/editor";
import { EditorRefApi } from "@plane/editor";
import { callNative } from "@/helpers/flutter-callback.helper";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";

export const useToolbar = (editorRef: React.MutableRefObject<EditorRefApi | null>) => {
  // Notifies the native code to with active toolbar state.
  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) return;

    const newActiveStates: Record<string, boolean> = {};
    Object.values(TOOLBAR_ITEMS.document)
      .flat()
      .forEach((item) => {
        newActiveStates[item.key] =
          // @ts-expect-error type mismatch here
          editorRef.current?.isMenuItemActive({
            itemKey: item.key,
          }) ?? false;
      });
    callNative(CallbackHandlerStrings.getActiveToolbarState, JSON.stringify(newActiveStates));
  }, []);

  return {
    updateActiveStates,
  };
};
