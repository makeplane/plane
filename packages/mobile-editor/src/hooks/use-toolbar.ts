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

import { useCallback } from "react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { TOOLBAR_ITEMS } from "@/constants/editor";
// helpers
import { callNative } from "@/helpers/flutter-callback.helper";

export const useToolbar = (editorRef: React.MutableRefObject<EditorRefApi | null>) => {
  // Notifies the native code to with active toolbar state.
  const updateActiveStates = useCallback(() => {
    if (!editorRef.current) return;
    const newActiveStates: Record<string, boolean> = {};
    Object.values(TOOLBAR_ITEMS)
      .flat()
      .forEach((item) => {
        newActiveStates[item.key] =
          // @ts-expect-error type mismatch here
          editorRef.current?.isMenuItemActive({
            itemKey: item.key,
          }) ?? false;
      });
    void callNative(CallbackHandlerStrings.getActiveToolbarState, JSON.stringify(newActiveStates));
  }, [editorRef]);

  return {
    updateActiveStates,
  };
};
