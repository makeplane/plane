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

import type { Extensions } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import type { MutableRefObject } from "react";
import { forwardRef, useEffect, useMemo } from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { PageRenderer } from "@/components/editors";

// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import type { EditorRefApi, IDocumentEditorProps } from "@/types";

function DocumentEditor(props: IDocumentEditorProps) {
  const {
    bubbleMenuEnabled = false,
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    extensions: externalExtensions,
    extendedEditorProps,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    getEditorMetaData,
    handleEditorReady,
    id,
    isTouchDevice,
    loader,
    mentionHandler,
    onChange,
    onEditorInstanceCreated,
    user,
    value,
  } = props;

  const extensions: Extensions = useMemo(() => {
    return [
      ...(externalExtensions ?? []),
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      HeadingListExtension,
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        extendedEditorProps,
        flaggedExtensions,
        isEditable: editable,
        fileHandler,
        userDetails: user ?? {
          id: "",
          name: "",
          color: "",
        },
      }),
    ];
  }, [externalExtensions, disabledExtensions, editable, extendedEditorProps, fileHandler, flaggedExtensions, user]);

  const editor = useEditor({
    disabledExtensions,
    editable,
    editorClassName,
    enableHistory: true,
    extendedEditorProps,
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    getEditorMetaData,
    handleEditorReady,
    id,
    initialValue: value,
    mentionHandler,
    onChange,
  });

  // Notify parent when editor instance is created
  useEffect(() => {
    if (editor && onEditorInstanceCreated) {
      onEditorInstanceCreated(editor);
    }
  }, [editor, onEditorInstanceCreated]);

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return loader ?? null;

  return (
    <PageRenderer
      bubbleMenuEnabled={bubbleMenuEnabled}
      disabledExtensions={disabledExtensions}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={cn(editorContainerClassName, "document-editor")}
      extendedEditorProps={extendedEditorProps}
      id={id}
      flaggedExtensions={flaggedExtensions}
      isTouchDevice={!!isTouchDevice}
    />
  );
}

const DocumentEditorWithRef = forwardRef(function DocumentEditorWithRef(
  props: IDocumentEditorProps,
  ref: React.ForwardedRef<EditorRefApi>
) {
  return <DocumentEditor {...props} forwardedRef={ref as MutableRefObject<EditorRefApi | null>} />;
});

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditorWithRef };
