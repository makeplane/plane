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

import type { Editor } from "@tiptap/core";
import { ArrowLeft, ArrowRight, Copy, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import { CloseIcon } from "@plane/propel/icons";

type TColumnItemKey = "insert-left" | "insert-right" | "duplicate" | "clear-contents" | "delete";

const DROPDOWN_ITEMS: {
  key: TColumnItemKey;
  label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
  action: (editor: Editor, columnPos: number) => void;
}[] = [
  {
    key: "insert-left",
    label: "Insert left",
    icon: ArrowLeft,
    action: (editor, columnPos) => editor.commands.insertColumnLeft({ columnPos }),
  },
  {
    key: "insert-right",
    label: "Insert right",
    icon: ArrowRight,
    action: (editor, columnPos) => editor.commands.insertColumnRight({ columnPos }),
  },
  {
    key: "duplicate",
    label: "Duplicate",
    icon: Copy,
    action: (editor, columnPos) => editor.commands.duplicateColumn({ columnPos }),
  },
  {
    key: "clear-contents",
    label: "Clear contents",
    icon: CloseIcon,
    action: (editor, columnPos) => editor.commands.clearColumnContents({ columnPos }),
  },
  {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    action: (editor, columnPos) => editor.commands.deleteMultiColumn({ columnPos }),
  },
];

type Props = {
  editor: Editor;
  columnPos: number;
  onClose: () => void;
};

export const ColumnOptionsDropdown: React.FC<Props> = (props) => {
  const { editor, columnPos, onClose } = props;

  return (
    <>
      {DROPDOWN_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className="flex items-center gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-1"
          onMouseDown={(e) => {
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();
            item.action(editor, columnPos);
            onClose();
          }}
        >
          <item.icon className="shrink-0 size-3" />
          <div className="flex-grow truncate">{item.label}</div>
        </button>
      ))}
    </>
  );
};
