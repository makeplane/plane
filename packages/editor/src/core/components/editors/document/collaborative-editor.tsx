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
// plane imports
import { cn } from "@plane/utils";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// contexts
import { CollaborationProvider, useCollaboration } from "@/contexts/collaboration-context";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
import { DocumentEditorSideEffects } from "@/plane-editor/components/document-editor-side-effects";
// types
import type { EditorRefApi, ICollaborativeDocumentEditorProps } from "@/types";

// Inner component that has access to collaboration context
function CollaborativeDocumentEditorInner(props: ICollaborativeDocumentEditorProps) {
  const {
    aiHandler,
    bubbleMenuEnabled = true,
    containerClassName,
    documentLoaderClassName,
    extensions = [],
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    editorProps,
    extendedEditorProps,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    getEditorMetaData,
    handleEditorReady,
    id,
    dragDropEnabled = true,
    isTouchDevice,
    mentionHandler,
    pageRestorationInProgress,
    onAssetChange,
    onChange,
    onEditorFocus,
    onTransaction,
    placeholder,
    tabIndex,
    user,
    extendedDocumentEditorProps,
    titleRef,
    updatePageProperties,
    isFetchingFallbackBinary,
  } = props;

  // Get non-null provider from context
  const { provider, state, actions } = useCollaboration();

  // Editor initialization with guaranteed non-null provider
  const { editor, titleEditor } = useCollaborativeEditor({
    provider,
    disabledExtensions,
    editable,
    editorClassName,
    editorProps,
    extendedDocumentEditorProps,
    extendedEditorProps,
    extensions,
    fileHandler,
    flaggedExtensions,
    getEditorMetaData,
    forwardedRef,
    handleEditorReady,
    id,
    dragDropEnabled,
    isTouchDevice,
    mentionHandler,
    onAssetChange,
    onChange,
    onEditorFocus,
    onTransaction,
    placeholder,
    tabIndex,
    titleRef,
    updatePageProperties,
    user,
    actions,
  });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  // Show loader ONLY when cache is known empty and server hasn't synced yet
  const shouldShowSyncLoader = state.isCacheReady && !state.hasCachedContent && !state.isServerSynced;
  const shouldWaitForFallbackBinary = isFetchingFallbackBinary && !state.hasCachedContent && state.isServerDisconnected;
  const isLoading = shouldShowSyncLoader || shouldWaitForFallbackBinary || pageRestorationInProgress;

  // Gate content rendering on isDocReady to prevent empty editor flash
  const showContentSkeleton = !state.isDocReady;

  if (!editor || !titleEditor) return null;

  return (
    <>
      <DocumentEditorSideEffects
        editor={editor}
        id={id}
        updatePageProperties={updatePageProperties}
        extendedEditorProps={extendedEditorProps}
      />
      <div
        className={cn(
          "transition-opacity duration-200",
          showContentSkeleton && !isLoading && "opacity-0 pointer-events-none"
        )}
      >
        <PageRenderer
          aiHandler={aiHandler}
          bubbleMenuEnabled={bubbleMenuEnabled}
          displayConfig={displayConfig}
          documentLoaderClassName={documentLoaderClassName}
          disabledExtensions={disabledExtensions}
          extendedDocumentEditorProps={extendedDocumentEditorProps}
          editor={editor}
          flaggedExtensions={flaggedExtensions}
          titleEditor={titleEditor}
          editorContainerClassName={cn(editorContainerClassNames, "document-editor")}
          extendedEditorProps={extendedEditorProps}
          id={id}
          isLoading={isLoading}
          isTouchDevice={!!isTouchDevice}
          tabIndex={tabIndex}
          provider={provider}
          state={state}
        />
      </div>
    </>
  );
}

// Outer component that provides collaboration context
function CollaborativeDocumentEditor(props: ICollaborativeDocumentEditorProps) {
  const { id, realtimeConfig, serverHandler, user, extendedDocumentEditorProps } = props;

  const token = useMemo(() => JSON.stringify(user), [user]);

  return (
    <CollaborationProvider
      docId={id}
      serverUrl={realtimeConfig.url}
      authToken={token}
      user={user}
      onStateChange={serverHandler?.onStateChange}
      shouldSendSyncedEvent={!extendedDocumentEditorProps?.isSelfHosted}
    >
      <CollaborativeDocumentEditorInner {...props} />
    </CollaborationProvider>
  );
}

const CollaborativeDocumentEditorWithRef = React.forwardRef(function CollaborativeDocumentEditorWithRef(
  props: ICollaborativeDocumentEditorProps,
  ref: React.ForwardedRef<EditorRefApi>
) {
  return (
    <CollaborativeDocumentEditor key={props.id} {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi>} />
  );
});

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };
