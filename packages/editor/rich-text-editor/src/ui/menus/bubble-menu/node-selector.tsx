import { BulletListItem, cn, CodeItem, HeadingOneItem, HeadingThreeItem, HeadingTwoItem, NumberedListItem, QuoteItem, TodoListItem } from "@plane/editor-core";
import { Editor } from "@tiptap/react";
import {
  Check,
  ChevronDown,
  TextIcon,
} from "lucide-react";
import { Dispatch, FC, SetStateAction } from "react";

import { BubbleMenuItem } from ".";

interface NodeSelectorProps {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const NodeSelector: FC<NodeSelectorProps> = ({ editor, isOpen, setIsOpen }) => {
  const items: BubbleMenuItem[] = [
    {
      name: "Text",
      icon: TextIcon,
      command: () => editor.chain().focus().toggleNode("paragraph", "paragraph").run(),
      isActive: () =>
        editor.isActive("paragraph") &&
        !editor.isActive("bulletList") &&
        !editor.isActive("orderedList"),
    },
    HeadingOneItem(editor),
    HeadingTwoItem(editor),
    HeadingThreeItem(editor),
    TodoListItem(editor),
    BulletListItem(editor),
    NumberedListItem(editor),
    QuoteItem(editor),
    CodeItem(editor),
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? {
    name: "Multiple",
  };

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-full items-center gap-1 whitespace-nowrap p-2 text-sm font-medium text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5"
      >
        <span>{activeItem?.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <section className="fixed top-full z-[99999] mt-1 flex w-48 flex-col overflow-hidden rounded border border-custom-border-300 bg-custom-background-100 p-1 shadow-xl animate-in fade-in slide-in-from-top-1">
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                item.command();
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center justify-between rounded-sm px-2 py-1 text-sm text-custom-text-200 hover:bg-custom-primary-100/5 hover:text-custom-text-100",
                { "bg-custom-primary-100/5 text-custom-text-100": activeItem.name === item.name }
              )}
            >
              <div className="flex items-center space-x-2">
                <div className="rounded-sm border border-custom-border-300 p-1">
                  <item.icon className="h-3 w-3" />
                </div>
                <span>{item.name}</span>
              </div>
              {activeItem.name === item.name && <Check className="h-4 w-4" />}
            </button>
          ))}
        </section>
      )}
    </div>
  );
};
