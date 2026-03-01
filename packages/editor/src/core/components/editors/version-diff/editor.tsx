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

import Collaboration from "@tiptap/extension-collaboration";
import type { Content, Extensions } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ySyncPluginKey } from "y-prosemirror";
import * as Y from "yjs";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentEditorWithRef } from "@/components/editors/document/editor";
import { DocumentContentLoader } from "@/components/editors/document/loader";
// helpers
import { extractUserIdsFromPermanentUserData } from "@/helpers/version-diff-utils";
// extensions
import { getVersionDiffExtensions } from "./extensions";
// local
import { createColorMapping } from "./user-colors";
import { YChangeTooltipContainer } from "./ychange-tooltip-container";
// types
import type { IEditorProps, TDisplayConfig } from "@/types";
import type { TUserInfo } from "./user-tooltip";

export type TPrecomputedDiff = {
  docUpdate: Uint8Array;
  oldSnapshot: Uint8Array;
  newSnapshot: Uint8Array;
};

export type TVersionDiffEditorProps = Pick<
  IEditorProps,
  | "id"
  | "disabledExtensions"
  | "flaggedExtensions"
  | "fileHandler"
  | "getEditorMetaData"
  | "mentionHandler"
  | "placeholder"
  | "showPlaceholderOnEmpty"
  | "tabIndex"
  | "extendedEditorProps"
> & {
  precomputedDiff: TPrecomputedDiff;
  currentVersionCreatedBy?: string | null;
  userMap?: Map<string, TUserInfo> | null;
  getUserInfo?: (userId: string) => TUserInfo | null;
  displayConfig?: TDisplayConfig;
  containerClassName?: string;
  editorClassName?: string;
  currentUserId?: string;
  /** Fallback text when user display_name is not available. Defaults to "Unknown user" */
  unknownUserText?: string;
};

// Hoist constants outside component (rendering-hoist-jsx)
const EMPTY_CONTENT: Content = { type: "doc", content: [] };

// Hoist hash function outside component to avoid recreation on each render
const hashArray = (arr: Uint8Array): number => {
  let hash = 0;
  for (let i = 0; i < Math.min(arr.length, 100); i++) {
    hash = ((hash << 5) - hash + arr[i]) | 0;
  }
  return hash;
};

const VersionDiffEditorComponent = forwardRef<HTMLDivElement, TVersionDiffEditorProps>((props, ref) => {
  const {
    precomputedDiff,
    currentVersionCreatedBy,
    id,
    userMap,
    getUserInfo,
    displayConfig,
    containerClassName,
    editorClassName,
    currentUserId,
    disabledExtensions,
    extendedEditorProps,
    fileHandler,
    flaggedExtensions,
    getEditorMetaData,
    mentionHandler,
    unknownUserText,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [isDiffReady, setIsDiffReady] = useState(false);

  // Create Y.Doc from precomputed diff and decode snapshots
  const { ydoc, permanentUserData, snapshot, prevSnapshot, colorMapping, snapshotsKey } = useMemo(() => {
    const { docUpdate, oldSnapshot, newSnapshot } = precomputedDiff;

    const doc = new Y.Doc({ gc: false });
    Y.applyUpdate(doc, docUpdate);

    const decodedOldSnapshot = Y.decodeSnapshotV2(oldSnapshot);
    const decodedNewSnapshot = Y.decodeSnapshotV2(newSnapshot);

    const userData = new Y.PermanentUserData(doc);
    const storedUserIds = extractUserIdsFromPermanentUserData(userData);
    const userIds =
      storedUserIds.length > 0 ? storedUserIds : [currentVersionCreatedBy || currentUserId || "default-user"];
    const colorMap = createColorMapping(userIds);

    const key = `${docUpdate.length}-${hashArray(docUpdate)}-${oldSnapshot.length}-${hashArray(oldSnapshot)}-${newSnapshot.length}-${hashArray(newSnapshot)}`;

    return {
      ydoc: doc,
      permanentUserData: userData,
      snapshot: decodedNewSnapshot,
      prevSnapshot: decodedOldSnapshot,
      colorMapping: colorMap,
      snapshotsKey: key,
    };
  }, [precomputedDiff, currentVersionCreatedBy, currentUserId]);

  const extensions: Extensions = useMemo(
    () => [
      ...getVersionDiffExtensions(),
      Collaboration.configure({
        document: ydoc,
        field: "default",
        ySyncOptions: {
          permanentUserData,
          colorMapping,
        },
      }),
    ],
    [ydoc, permanentUserData, colorMapping]
  );

  // Apply snapshots immediately when editor is created - no useEffect needed
  // This runs synchronously when editor instance becomes available
  const handleEditorInstanceCreated = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      const applySnapshots = () => {
        if (editor.isDestroyed) return;

        const ySyncState = ySyncPluginKey.getState(editor.view.state);
        if (!ySyncState) {
          requestAnimationFrame(applySnapshots);
          return;
        }

        try {
          const tr = editor.view.state.tr.setMeta(ySyncPluginKey, { prevSnapshot, snapshot });
          editor.view.dispatch(tr);
        } catch (error) {
          console.error("Failed to apply version snapshots:", error);
        }
        setIsDiffReady(true);
      };

      requestAnimationFrame(applySnapshots);
    },
    [prevSnapshot, snapshot]
  );

  // Reset diff ready state when snapshots change (moved to useEffect to avoid state update during render)
  useEffect(() => {
    setIsDiffReady(false);
  }, [snapshotsKey]);

  // Cleanup Y.Doc on unmount
  useEffect(
    () => () => {
      ydoc.destroy();
    },
    [ydoc]
  );

  return (
    <div
      ref={(node) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn("version-diff-editor", containerClassName)}
    >
      <DocumentEditorWithRef
        id={id}
        disabledExtensions={disabledExtensions ?? []}
        flaggedExtensions={flaggedExtensions ?? []}
        fileHandler={fileHandler}
        getEditorMetaData={getEditorMetaData}
        mentionHandler={mentionHandler}
        extendedEditorProps={extendedEditorProps}
        displayConfig={displayConfig}
        editable={false}
        value={EMPTY_CONTENT}
        editorClassName={editorClassName}
        extensions={extensions}
        onEditorInstanceCreated={handleEditorInstanceCreated}
        bubbleMenuEnabled={false}
        loader={
          <div className="px-10 py-4">
            <DocumentContentLoader />
          </div>
        }
      />
      {editorRef.current && isDiffReady && (
        <YChangeTooltipContainer
          editor={editorRef.current}
          containerRef={containerRef}
          editorId={id}
          userMap={userMap}
          getUserInfo={getUserInfo}
          unknownUserText={unknownUserText}
        />
      )}
    </div>
  );
});

VersionDiffEditorComponent.displayName = "VersionDiffEditor";

export const VersionDiffEditor = VersionDiffEditorComponent;
