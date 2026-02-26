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

import React, { useMemo } from "react";
import type {
  EditorRefApi,
  TDisplayConfig,
  TFileHandler,
  TMentionHandler,
  IEditorProps,
  ILiteTextEditorProps,
} from "@plane/editor";
import { LiteTextEditorWithRef } from "@plane/editor";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { EDITOR_PROPS } from "@/constants/editor";
// helpers
import { callNative } from "@/helpers";
// hooks
import { useEditorFlagging } from "@/hooks";
// types
import type { TEditorParams, TOnEditorFocusProps, TScrollIntoViewProps } from "@/types";
import { TEditorVariant } from "@/types";
// components
import { EditorScrollConfigWrapper } from "./editor-scroll-config";

type Props = {
  displayConfig: TDisplayConfig;
  editorRef: React.RefObject<EditorRefApi>;
  externalExtensions: IEditorProps["extensions"];
  fileHandler: TFileHandler;
  handleEditorReady: (isReady: boolean) => void;
  initialParams: TEditorParams;
  mentionHandler: TMentionHandler;
  onEditorFocus: (props: TOnEditorFocusProps) => void;
  updateActiveStates: () => void;
  variant: TEditorVariant;
  scrollIntoView: (props: TScrollIntoViewProps) => void;
};

export const MobileLiteTextEditor: React.FC<Props> = (props) => {
  const {
    displayConfig,
    editorRef,
    externalExtensions,
    fileHandler,
    handleEditorReady,
    initialParams,
    mentionHandler,
    onEditorFocus,
    updateActiveStates,
    variant,
    scrollIntoView,
  } = props;

  const {
    liteText: { flagged: flaggedExtensions, disabled: disabledExtensions },
  } = useEditorFlagging();

  const liteTextEditorProps: ILiteTextEditorProps = useMemo(() => {
    const shouldScrollIntoView = variant === TEditorVariant.sticky;
    const isAndroid = /Android/i.test(navigator.userAgent);

    const onTransaction: IEditorProps["onTransaction"] = () => {
      updateActiveStates();
      if (shouldScrollIntoView) {
        // Debounce the scroll into view to avoid excessive scrolling
        const timeoutId = setTimeout(() => {
          scrollIntoView({
            variant,
            scrollBehavior: "instant",
            extraPadding: 20,
          });
        }, 100); // 100ms debounce

        return () => clearTimeout(timeoutId);
      }
    };

    return {
      autofocus: initialParams?.autoFocus ?? false,
      containerClassName: "p-0 border-none !px-5",
      disabledExtensions: disabledExtensions,
      displayConfig: displayConfig,
      editable: true,
      editorClassName: "pb-32",
      editorProps: isAndroid && variant === TEditorVariant.sticky ? EDITOR_PROPS : undefined,
      extendedEditorProps: {
        isSmoothCursorEnabled: false,
      },
      getEditorMetaData: () => ({
        user_mentions: [],
        file_assets: [],
      }),
      extensions: externalExtensions,
      fileHandler: fileHandler,
      flaggedExtensions: flaggedExtensions,
      handleEditorReady: handleEditorReady,
      id: "lite-editor",
      initialValue: initialParams?.content ?? "<p></p>",
      isSmoothCursorEnabled: false,
      isTouchDevice: true,
      mentionHandler: mentionHandler,
      onChange: (_, html) => callNative(CallbackHandlerStrings.onContentChange, html),
      onEditorFocus: () => onEditorFocus({ variant, scrollIntoView: shouldScrollIntoView }),
      onTransaction: onTransaction,
      placeholder: initialParams?.placeholder,
      ref: editorRef,
    };
  }, [
    disabledExtensions,
    displayConfig,
    editorRef,
    externalExtensions,
    fileHandler,
    handleEditorReady,
    initialParams,
    mentionHandler,
    onEditorFocus,
    scrollIntoView,
    updateActiveStates,
    variant,
    flaggedExtensions,
  ]);

  if (variant === TEditorVariant.sticky) {
    return (
      <EditorScrollConfigWrapper editorRef={editorRef}>
        <LiteTextEditorWithRef {...liteTextEditorProps} containerClassName="p-0 border-none !px-5 pb-32" />
      </EditorScrollConfigWrapper>
    );
  }

  return <LiteTextEditorWithRef {...liteTextEditorProps} ref={editorRef} editorClassName="!pb-0 min-h-screen" />;
};
