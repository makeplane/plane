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

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, useEditorState } from "@tiptap/react";
import { useCallback, useState } from "react";
// constants
import { COLORS_LIST } from "@/constants/common";
import { CORE_EXTENSIONS } from "@/constants/extension";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
// local components
import { CalloutBlockColorSelector } from "./color-selector";
import { CalloutBlockLogoSelector } from "./logo-selector";
// types
import type { TCalloutBlockAttributes } from "./types";
import { ECalloutAttributeNames } from "./types";
// utils
import { updateStoredBackgroundColor } from "./utils";

export type CustomCalloutNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TCalloutBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TCalloutBlockAttributes>) => void;
};

export function CustomCalloutBlock(props: CustomCalloutNodeViewProps) {
  const { decorations, editor, node, updateAttributes } = props;

  const isEmojiPickerOpen = useEditorState({
    editor,
    selector: (ctx) => {
      const calloutStorage = ctx.editor.storage[CORE_EXTENSIONS.CALLOUT];
      const id = node.attrs.id;
      if (!id) return false;
      return calloutStorage?.openedLogoPickerId === id;
    },
  });

  // states
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // callbacks
  const handleEmojiPickerOpen = useCallback(
    (val: boolean) => {
      const calloutStorage = editor.storage[CORE_EXTENSIONS.CALLOUT];
      const id = node.attrs.id;
      if (!calloutStorage) return;
      if (val && !id) return;
      calloutStorage.openedLogoPickerId = val ? id : null;
      editor.view.dispatch(editor.state.tr);
    },
    [editor, node.attrs.id]
  );

  // derived values
  const activeBackgroundColor = COLORS_LIST.find((c) => node.attrs["data-background"] === c.key)?.backgroundColor;

  return (
    <YChangeNodeViewWrapper
      decorations={decorations}
      className="callout-component editor-callout-component group/callout-node relative bg-layer-3 rounded-lg text-primary p-4 my-2 flex items-start gap-4 transition-colors duration-500 break-words min-w-0"
      style={{ backgroundColor: activeBackgroundColor }}
    >
      <CalloutBlockLogoSelector
        blockAttributes={node.attrs}
        disabled={!editor.isEditable}
        isOpen={isEmojiPickerOpen}
        handleOpen={handleEmojiPickerOpen}
        updateAttributes={updateAttributes}
      />
      <CalloutBlockColorSelector
        disabled={!editor.isEditable}
        isOpen={isColorPickerOpen}
        toggleDropdown={() => setIsColorPickerOpen((prev) => !prev)}
        onSelect={(val) => {
          updateAttributes({
            [ECalloutAttributeNames.BACKGROUND]: val,
          });
          updateStoredBackgroundColor(val);
        }}
      />
      <NodeViewContent as="div" className="w-full break-words min-w-0" />
    </YChangeNodeViewWrapper>
  );
}
