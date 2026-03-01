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

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content, Extensions } from "@tiptap/core";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useEditor } from "@tiptap/react";
import { useImperativeHandle } from "react";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { TitleExtensions } from "@/extensions/title-extension";
// helpers
import { getEditorRefHelpers } from "@/helpers/editor-ref";
// plane editor imports
import { SmoothCursorExtension } from "@/plane-editor/extensions/smooth-cursor";
// types
import type { IEditorPropsExtended } from "@/types";
import type { EditorTitleRefApi, ICollaborativeDocumentEditorProps, IEditorProps } from "@/types/editor";
import type { Fragment, Node as ProseMirrorNode } from "@tiptap/pm/model";

export type TUseTitleEditorProps = {
  editable?: boolean;
  provider: HocuspocusProvider;
  titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
  extensions?: Extensions;
  initialValue?: string;
  field?: string;
  placeholder?: string;
  updatePageProperties?: ICollaborativeDocumentEditorProps["updatePageProperties"];
  id: string;
  extendedEditorProps?: IEditorPropsExtended;
  getEditorMetaData?: IEditorProps["getEditorMetaData"];
  onFocus?: () => void;
};

/**
 * A hook that creates a title editor with collaboration features
 * Uses the same Y.Doc as the main editor but a different field
 */
export const useTitleEditor = (props: TUseTitleEditorProps) => {
  const {
    editable = true,
    id,
    initialValue = "",
    extendedEditorProps,
    extensions,
    onFocus,
    provider,
    updatePageProperties,
    titleRef,
  } = props;

  const { isSmoothCursorEnabled } = extendedEditorProps ?? {};

  // Force editor recreation when Y.Doc changes (provider.document.guid)
  const docKey = provider?.document?.guid ?? id;

  const editor = useEditor(
    {
      onFocus,
      onUpdate: () => {
        updatePageProperties?.(id, "property_updated", { name: editor?.getText() });
      },
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: [
        ...TitleExtensions,
        ...(extensions ?? []),
        ...(isSmoothCursorEnabled ? [SmoothCursorExtension] : []),
        Placeholder.configure({
          placeholder: () => "Untitled",
          includeChildren: true,
          showOnlyWhenEditable: false,
        }),
      ],
      content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<h1></h1>",
    },
    [editable, initialValue, docKey]
  );

  useImperativeHandle(titleRef, () => ({
    ...getEditorRefHelpers({
      editor,
      provider,
      getEditorMetaData: () => ({
        file_assets: [],
        user_mentions: [],
      }),
    }),
    clearEditor: (emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true)
        .clearContent(emitUpdate)
        .run();
    },
    setEditorValue: (content: Content | Fragment | ProseMirrorNode) => {
      editor?.commands.setContent(content, false);
    },
  }));

  return editor;
};
