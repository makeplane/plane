/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import {
  ArrowNarrowLeftOutline,
  ArrowNarrowRightOutline,
  CloseOutline,
  CopyOutline,
  DeleteOutline,
  ToggleFilled,
} from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { MenuItemContent, MenuItemTitle, MenuItemTrailing, MenuSeparator } from "@makeplane/propel/elements/menu";
// extensions
import type { ISvgIcons } from "@plane/blocks/icons";
import { FloatingMenuItem } from "@/components/menus/floating-menu/root";
import { findTable, getSelectedColumns } from "@/extensions/table/table/utilities/helpers";
// local imports
import { duplicateColumns } from "../actions";
import { TableDragHandleDropdownColorSelector } from "../color-selector";

const DROPDOWN_ITEMS: {
  key: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>> | React.FC<ISvgIcons>;
  action: (editor: Editor) => void;
}[] = [
  {
    key: "insert-left",
    label: "Insert left",
    icon: ArrowNarrowLeftOutline,
    action: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    key: "insert-right",
    label: "Insert right",
    icon: ArrowNarrowRightOutline,
    action: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    key: "duplicate",
    label: "Duplicate",
    icon: CopyOutline,
    action: (editor) => {
      const table = findTable(editor.state.selection);
      if (!table) return;

      const tableMap = TableMap.get(table.node);
      let tr = editor.state.tr;
      const selectedColumns = getSelectedColumns(editor.state.selection, tableMap);
      tr = duplicateColumns(table, selectedColumns, tr);
      editor.view.dispatch(tr);
    },
  },
  {
    key: "clear-contents",
    label: "Clear contents",
    icon: CloseOutline,
    action: (editor) => editor.chain().focus().clearSelectedCells().run(),
  },
  {
    key: "delete",
    label: "Delete",
    icon: DeleteOutline,
    action: (editor) => editor.chain().focus().deleteColumn().run(),
  },
];

type Props = {
  editor: Editor;
  onClose: () => void;
};

export function ColumnOptionsDropdown(props: Props) {
  const { editor, onClose } = props;

  return (
    <>
      <FloatingMenuItem
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleHeaderColumn().run();
          onClose();
        }}
      >
        <MenuItemContent>
          <MenuItemTitle>Header column</MenuItemTitle>
        </MenuItemContent>
        <MenuItemTrailing>
          <Icon icon={ToggleFilled} tint="secondary" />
        </MenuItemTrailing>
      </FloatingMenuItem>
      <MenuSeparator render={<hr />} />
      <TableDragHandleDropdownColorSelector editor={editor} onSelect={onClose} />
      {DROPDOWN_ITEMS.map((item) => (
        <FloatingMenuItem
          key={item.key}
          type="button"
          variant={item.key === "delete" ? "danger" : "neutral"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.action(editor);
            onClose();
          }}
        >
          <Icon icon={item.icon} />
          <MenuItemContent>
            <MenuItemTitle>{item.label}</MenuItemTitle>
          </MenuItemContent>
        </FloatingMenuItem>
      ))}
    </>
  );
}
