/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/react";

import { ChevronDownOutline, TickOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { MenuItemContent, MenuItemIndicator, MenuItemTitle, MenuPopup } from "@makeplane/propel/elements/menu";
import { ToolbarMenuTriggerButton, ToolbarMenuTriggerLabel } from "@makeplane/propel/elements/toolbar";
// components
import type { EditorMenuItem } from "@/components/menus";
import {
  BulletListItem,
  HeadingOneItem,
  HeadingThreeItem,
  HeadingTwoItem,
  NumberedListItem,
  QuoteItem,
  CodeItem,
  TodoListItem,
  TextItem,
  HeadingFourItem,
  HeadingFiveItem,
  HeadingSixItem,
} from "@/components/menus";
// types
import type { TEditorCommands } from "@/types";
// local imports
import { FloatingMenuItem, FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";

type Props = {
  editor: Editor;
};

export function BubbleMenuNodeSelector(props: Props) {
  const { editor } = props;
  // floating ui
  const { options, getReferenceProps, getFloatingProps } = useFloatingMenu({});
  const { context } = options;
  const items: EditorMenuItem<TEditorCommands>[] = [
    TextItem(editor),
    HeadingOneItem(editor),
    HeadingTwoItem(editor),
    HeadingThreeItem(editor),
    HeadingFourItem(editor),
    HeadingFiveItem(editor),
    HeadingSixItem(editor),
    BulletListItem(editor),
    NumberedListItem(editor),
    TodoListItem(editor),
    QuoteItem(editor),
    CodeItem(editor),
  ] as EditorMenuItem<TEditorCommands>[];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? {
    name: "Multiple",
  };

  return (
    <FloatingMenuRoot
      classNames={{
        buttonContainer: "h-full",
      }}
      renderButton={(buttonProps) => (
        <ToolbarMenuTriggerButton {...buttonProps} size="sm" data-popup-open={context.open ? "" : undefined} />
      )}
      menuButton={
        <>
          <ToolbarMenuTriggerLabel>{activeItem?.name}</ToolbarMenuTriggerLabel>
          <Icon icon={ChevronDownOutline} />
        </>
      }
      options={options}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
    >
      <MenuPopup elevation="raised" render={<section className="mt-1 max-h-[90vh] overflow-y-scroll" />}>
        {items.map((item) => (
          <FloatingMenuItem
            key={item.name}
            type="button"
            aria-pressed={activeItem.name === item.name}
            onClick={(e) => {
              item.command();
              context.onOpenChange(false);
              e.stopPropagation();
            }}
          >
            <Icon icon={item.icon} />
            <MenuItemContent>
              <MenuItemTitle>{item.name}</MenuItemTitle>
            </MenuItemContent>
            {activeItem.name === item.name && (
              <MenuItemIndicator data-selected="">
                <TickOutline />
              </MenuItemIndicator>
            )}
          </FloatingMenuItem>
        ))}
      </MenuPopup>
    </FloatingMenuRoot>
  );
}
