import { Editor } from "@tiptap/react";
import { Check, ChevronDown } from "lucide-react";
import { FC } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
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
  EditorMenuItem,
} from "@/components/menus";
// types
import type { TEditorCommands } from "@/types";
// local imports
import { FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";

type Props = {
  editor: Editor;
};

export const BubbleMenuNodeSelector: FC<Props> = (props) => {
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
          "h-full flex items-center gap-1 px-3 text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 rounded whitespace-nowrap transition-colors",
          {
            "bg-custom-background-80": context.open,
          }
        ),
      }}
      menuButton={
        <>
          <span>{activeItem?.name}</span>
          <ChevronDown className="shrink-0 size-3" />
        </>
      }
      options={options}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
    >
      <section className="w-48 max-h-[90vh] mt-1 flex flex-col overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg">
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
              "flex items-center justify-between rounded px-1 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80",
              {
                "bg-custom-background-80": activeItem.name === item.name,
              }
            )}
          >
            <div className="flex items-center space-x-2">
              <item.icon className="size-3 flex-shrink-0" />
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <Check className="size-3 text-custom-text-300 flex-shrink-0" />}
          </button>
        ))}
      </section>
    </FloatingMenuRoot>
  );
};
