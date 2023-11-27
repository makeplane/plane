import { Editor } from "@tiptap/react";
import { BoldIcon } from "lucide-react";

import {
  BoldItem,
  BulletListItem,
  isCellSelection,
  cn,
  CodeItem,
  ImageItem,
  ItalicItem,
  NumberedListItem,
  QuoteItem,
  StrikeThroughItem,
  TableItem,
  UnderLineItem,
  HeadingOneItem,
  HeadingTwoItem,
  HeadingThreeItem,
  findTableAncestor,
} from "@plane/editor-core";
import { UploadImage } from "..";

export interface BubbleMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

type EditorBubbleMenuProps = {
  editor: Editor;
  uploadFile: UploadImage;
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void;
};

export const FixedMenu = (props: EditorBubbleMenuProps) => {
  const { editor, uploadFile, setIsSubmitting } = props;

  const basicMarkItems: BubbleMenuItem[] = [
    HeadingOneItem(editor),
    HeadingTwoItem(editor),
    HeadingThreeItem(editor),
    BoldItem(editor),
    ItalicItem(editor),
    UnderLineItem(editor),
    StrikeThroughItem(editor),
  ];

  const listItems: BubbleMenuItem[] = [
    BulletListItem(editor),
    NumberedListItem(editor),
  ];

  const userActionItems: BubbleMenuItem[] = [
    QuoteItem(editor),
    CodeItem(editor),
  ];

  function getComplexItems(): BubbleMenuItem[] {
    const items: BubbleMenuItem[] = [TableItem(editor)];

    if (shouldShowImageItem()) {
      items.push(ImageItem(editor, uploadFile, setIsSubmitting));
    }

    return items;
  }

  const complexItems: BubbleMenuItem[] = getComplexItems();

  function shouldShowImageItem(): boolean {
    if (typeof window !== "undefined") {
      const selectionRange: any = window?.getSelection();
      const { selection } = props.editor.state;

      if (selectionRange.rangeCount !== 0) {
        const range = selectionRange.getRangeAt(0);
        if (findTableAncestor(range.startContainer)) {
          return false;
        }
        if (isCellSelection(selection)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  return (
    <div className="flex items-center divide-x divide-custom-border-200">
      <div className="flex items-center gap-0.5 pr-2">
        {basicMarkItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={item.command}
            className={cn(
              "h-7 w-7 grid place-items-center text-custom-text-300 hover:bg-custom-background-80 rounded",
              {
                "text-custom-text-100 bg-custom-background-80": item.isActive(),
              },
            )}
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-0.5 px-2">
        {listItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={item.command}
            className={cn(
              "h-7 w-7 grid place-items-center text-custom-text-300 hover:bg-custom-background-80 rounded",
              {
                "text-custom-text-100 bg-custom-background-80": item.isActive(),
              },
            )}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-custom-text-100": item.isActive(),
              })}
            />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-0.5 px-2">
        {userActionItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={item.command}
            className={cn(
              "h-7 w-7 grid place-items-center text-custom-text-300 hover:bg-custom-background-80 rounded",
              {
                "text-custom-text-100 bg-custom-background-80": item.isActive(),
              },
            )}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-custom-text-100": item.isActive(),
              })}
            />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-0.5 pl-2">
        {complexItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={item.command}
            className={cn(
              "h-7 w-7 grid place-items-center text-custom-text-300 hover:bg-custom-background-80 rounded",
              {
                "text-custom-text-100 bg-custom-background-80": item.isActive(),
              },
            )}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-custom-text-100": item.isActive(),
              })}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
