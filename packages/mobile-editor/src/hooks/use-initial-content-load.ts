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

import { useCallback, useState } from "react";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { callNative } from "@/helpers/flutter-callback.helper";

export const useInitialContentLoad = (isEditorReady: boolean) => {
  const [isInitialContentLoaded, setIsInitialContentLoaded] = useState<boolean>(false);
  // Verifies editor initialization with initial content and triggers a callback with the content height
  const onInitialContentLoad = useCallback(() => {
    if (!isEditorReady) return;
    const editorContainer = document.querySelector(".editor-container");
    if (
      editorContainer &&
      '<p class="editor-paragraph-block"></p>' !== editorContainer.innerHTML &&
      !isInitialContentLoaded
    ) {
      setIsInitialContentLoaded(true);
      void callNative(CallbackHandlerStrings.onInitialContentLoad, editorContainer.clientHeight.toString());
    }
  }, [isInitialContentLoaded, isEditorReady]);

  return { onInitialContentLoad };
};
