import { Editor } from "@tiptap/react";
import { Check, ChevronDown } from "lucide-react";
import { FC, Dispatch, SetStateAction } from "react";
// plane imports
import { CustomMenu } from "@plane/ui";
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
import { TEditorCommands } from "@/types";

type Props = {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const BubbleMenuNodeSelector: FC<Props> = (props) => {
  const { editor, setIsOpen } = props;

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
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? {
    name: "Multiple",
  };

  return (
    <div className="px-1.5 py-1">
      <CustomMenu
        customButton={
          <span className="text-custom-text-300 text-sm border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 h-7 w-24 rounded px-2 flex items-center justify-between gap-2 whitespace-nowrap text-left">
            {activeItem?.name || "Text"}
            <ChevronDown className="flex-shrink-0 size-3" />
          </span>
        }
        placement="bottom-start"
        closeOnSelect
        maxHeight="lg"
      >
        {items.map((item) => (
          <CustomMenu.MenuItem
            key={item.name}
            className="flex items-center justify-between gap-2"
            onClick={(e) => {
              item.command();
              setIsOpen(false);
              e.stopPropagation();
            }}
          >
            <span className="flex items-center gap-2">
              <item.icon className="size-3" />
              {item.name}
            </span>
            {activeItem?.name === item.name && <Check className="size-3 text-custom-text-300 flex-shrink-0" />}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </div>
  );
};
