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

import { useCallback, useEffect, useState } from "react";
// components
import { MobileDocumentEditor } from "@/components";
import { EditorWrapper } from "@/components/editor/editor-wrapper";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// types
import { TEditorVariant } from "@/types/editor";

export function App() {
  const [variant, setVariant] = useState<TEditorVariant | undefined>(undefined);

  // It retrieves the variant from the native code, once the webview is loaded.
  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const variant = await callNative<string>(CallbackHandlerStrings.getVariant);
        if (!variant || !Object.keys(TEditorVariant).includes(variant)) return;
        setVariant(variant as TEditorVariant);
      } catch (error) {
        console.error("Failed to fetch editor variant", error);
      }
    };

    void fetchVariant();
  }, []);

  // It is used to set the variant from the native code.
  const setEditorVariant = useCallback((variant: string) => {
    if (!variant || !Object.keys(TEditorVariant).includes(variant)) return;
    setVariant(variant as TEditorVariant);
  }, []);

  useEffect(() => {
    window.setEditorVariant = setEditorVariant;
  }, [setEditorVariant]);

  if (!variant) return null;

  if (variant === TEditorVariant.document) return <MobileDocumentEditor />;

  // It renders the lite, sticky or rich editor based on the variant.
  return <EditorWrapper variant={variant as TEditorVariant} />;
}
