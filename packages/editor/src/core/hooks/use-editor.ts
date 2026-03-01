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

import { useEditorState, useEditor as useTiptapEditor } from "@tiptap/react";
import { useImperativeHandle, useEffect, useRef, useCallback } from "react";
import type { MarkdownStorage } from "tiptap-markdown";
// extensions
import { CoreEditorExtensions } from "@/extensions";
// helpers
import { getEditorRefHelpers } from "@/helpers/editor-ref";
// props
import { CoreEditorProps } from "@/props";
// types
import type { TEditorHookProps } from "@/types";
// utils
import { normalizeCodeBlockHTML } from "@/utils/normalize-code-blocks";
import { parseHTMLToJSON } from "@/utils/parse-html-to-doc";

declare module "@tiptap/core" {
  interface Storage {
    markdown: MarkdownStorage;
  }
}

export const useEditor = (props: TEditorHookProps) => {
  const {
    autofocus = false,
    disabledExtensions,
    editable = true,
    editorClassName = "",
    editorProps = {},
    enableHistory,
    extendedEditorProps,
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    getEditorMetaData,
    handleEditorReady,
    id = "",
    initialValue,
    isTouchDevice,
    mentionHandler,
    onAssetChange,
    onChange,
    onEditorFocus,
    onTransaction,
    placeholder,
    showPlaceholderOnEmpty,
    tabIndex,
    provider,
    value,
  } = props;

  // Force editor recreation when Y.Doc changes (provider.document.guid)
  const docKey = provider?.document?.guid ?? id;

  // Debounce onChange to prevent expensive getJSON/getHTML calls on every keystroke
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track pending debounced changes for flush-on-unmount
  const hasPendingOnChangeRef = useRef(false);
  const pendingEditorRef = useRef<ReturnType<typeof useTiptapEditor>>(null);

  // Flush pending onChange before editor is destroyed (unmount or docKey change)
  const flushPendingOnChange = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // No onChange callback = nothing to flush (e.g., CollaborativeDocumentEditor with Yjs)
    if (!onChangeRef.current || !hasPendingOnChangeRef.current) {
      hasPendingOnChangeRef.current = false;
      pendingEditorRef.current = null;
      return;
    }

    const editorInstance = pendingEditorRef.current;
    hasPendingOnChangeRef.current = false;
    pendingEditorRef.current = null;

    if (editorInstance && !editorInstance.isDestroyed) {
      onChangeRef.current(editorInstance.getJSON(), editorInstance.getHTML(), { isMigrationUpdate: false });
    }
  }, []);

  const debouncedOnChange = useCallback((editorInstance: typeof editor, isMigrationUpdate: boolean) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // For migration updates, call immediately and clear pending state
    if (isMigrationUpdate) {
      hasPendingOnChangeRef.current = false;
      pendingEditorRef.current = null;
      onChangeRef.current?.(editorInstance!.getJSON(), editorInstance!.getHTML(), { isMigrationUpdate: true });
      return;
    }

    // Mark as pending and store editor instance for potential flush
    hasPendingOnChangeRef.current = true;
    pendingEditorRef.current = editorInstance;

    // Debounce regular updates by 150ms to batch rapid keystrokes
    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
      if (editorInstance && !editorInstance.isDestroyed) {
        hasPendingOnChangeRef.current = false;
        pendingEditorRef.current = null;
        onChangeRef.current?.(editorInstance.getJSON(), editorInstance.getHTML(), { isMigrationUpdate: false });
      }
    }, 150);
  }, []);

  const editor = useTiptapEditor(
    {
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      autofocus,
      parseOptions: { preserveWhitespace: true },
      editorProps: {
        ...CoreEditorProps({
          editorClassName,
        }),
        ...editorProps,
      },
      extensions: [
        ...CoreEditorExtensions({
          disabledExtensions,
          editable,
          enableHistory,
          extendedEditorProps,
          fileHandler,
          flaggedExtensions,
          getEditorMetaData,
          isTouchDevice,
          mentionHandler,
          placeholder,
          showPlaceholderOnEmpty,
          tabIndex,
          provider,
        }),
        ...extensions,
      ],
      content: typeof initialValue === "string" ? undefined : initialValue,
      onCreate: ({ editor: newEditor }) => {
        if (typeof initialValue === "string") {
          const json = parseHTMLToJSON(normalizeCodeBlockHTML(initialValue), newEditor.schema);
          newEditor.commands.setContent(json);
        }
        handleEditorReady?.(true);
      },
      onTransaction: () => {
        onTransaction?.();
      },
      onUpdate: ({ editor: editorInstance, transaction }) => {
        // Check if this update is only due to migration update
        const isMigrationUpdate = transaction?.getMeta("uniqueIdOnlyChange") === true;
        // Use debounced onChange to prevent expensive serialization on every keystroke
        debouncedOnChange(editorInstance, isMigrationUpdate);
      },
      onDestroy: () => handleEditorReady?.(false),
      onFocus: onEditorFocus,
    },
    [editable, docKey]
  );

  // Flush pending onChange before editor is destroyed (on unmount or docKey change)
  // This effect MUST be after useTiptapEditor so its cleanup runs before TipTap destroys the editor
  useEffect(
    () => () => {
      flushPendingOnChange();
    },
    [editor, flushPendingOnChange]
  );

  // Effect for syncing SWR data
  useEffect(() => {
    // value is null when intentionally passed where syncing is not yet
    // supported and value is undefined when the data from swr is not populated
    if (value == null) return;
    if (editor) {
      const { uploadInProgress: isUploadInProgress } = editor.storage.utility;
      if (!editor.isDestroyed && !isUploadInProgress) {
        try {
          const contentToSet =
            typeof value === "string" ? parseHTMLToJSON(normalizeCodeBlockHTML(value), editor.schema) : value;
          editor.commands.setContent(contentToSet);
          if (editor.state.selection) {
            const docLength = editor.state.doc.content.size;
            const relativePosition = Math.min(editor.state.selection.from, docLength - 1);
            editor.commands.setTextSelection(relativePosition);
          }
        } catch (error) {
          console.error("Error syncing editor content with external value:", error);
        }
      }
    }
  }, [editor, value, id]);

  // update assets upload status
  useEffect(() => {
    if (!editor) return;
    const assetsUploadStatus = fileHandler.assetsUploadStatus;
    editor.commands.updateAssetsUploadStatus?.(assetsUploadStatus);
  }, [editor, fileHandler.assetsUploadStatus]);

  // subscribe to assets list changes
  const assetsList = useEditorState({
    editor,
    selector: ({ editor }) => ({
      assets: editor?.storage.utility?.assetsList ?? [],
    }),
  });
  // trigger callback when assets list changes
  useEffect(() => {
    const assets = assetsList?.assets;
    if (!assets || !onAssetChange) return;
    onAssetChange(assets);
  }, [assetsList?.assets, onAssetChange]);

  useImperativeHandle(
    forwardedRef,
    () =>
      getEditorRefHelpers({
        editor,
        getEditorMetaData,
        provider,
      }),
    [editor, getEditorMetaData, provider]
  );

  if (!editor) {
    return null;
  }

  return editor;
};
