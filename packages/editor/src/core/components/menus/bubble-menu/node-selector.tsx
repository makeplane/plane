import type { Editor } from "@tiptap/react";

import type { FC } from "react";
import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
// plane utils
import { cn } from "@plane/utils";
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
import { FloatingMenuRoot } from "../floating-menu/root";
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
        button: cn(
          "h-full flex items-center gap-1 px-3 text-13 font-medium text-tertiary hover:bg-layer-1 active:bg-layer-1 rounded-sm whitespace-nowrap transition-colors",
          {
            "bg-layer-1": context.open,
          }
        ),
      }}
      menuButton={
        <>
          <span>{activeItem?.name}</span>
          <ChevronDownIcon className="shrink-0 size-3" />
        </>
      }
      options={options}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
    >
      <section className="w-48 max-h-[90vh] mt-1 flex flex-col overflow-y-scroll rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={(e) => {
              item.command();
              context.onOpenChange(false);
              e.stopPropagation();
            }}
            className={cn(
              "flex items-center justify-between rounded-sm px-1 py-1.5 text-13 text-secondary hover:bg-layer-1",
              {
                "bg-layer-1": activeItem.name === item.name,
              }
            )}
          >
            <div className="flex items-center space-x-2">
              <item.icon className="size-3 flex-shrink-0" />
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <CheckIcon className="size-3 text-tertiary flex-shrink-0" />}
          </button>
        ))}
      </section>
    </FloatingMenuRoot>
  );
}
