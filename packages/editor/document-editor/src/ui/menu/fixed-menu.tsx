import { Editor } from "@tiptap/react";
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
  EditorMenuItem,
  UploadImage,
} from "@plane/editor-core";

export type BubbleMenuItem = EditorMenuItem;

type EditorBubbleMenuProps = {
  editor: Editor;
  uploadFile: UploadImage;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
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

  const listItems: BubbleMenuItem[] = [BulletListItem(editor), NumberedListItem(editor)];

  const userActionItems: BubbleMenuItem[] = [QuoteItem(editor), CodeItem(editor)];

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
    <div className="flex items-center divide-x divide-neutral-border-medium">
      <div className="flex items-center gap-0.5 pr-2">
        {basicMarkItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={item.command}
            className={cn(
              "grid h-7 w-7 place-items-center rounded text-neutral-text-medium hover:bg-neutral-component-surface-dark",
              {
                "bg-neutral-component-surface-dark text-neutral-text-strong": item.isActive(),
              }
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
              "grid h-7 w-7 place-items-center rounded text-neutral-text-medium hover:bg-neutral-component-surface-dark",
              {
                "bg-neutral-component-surface-dark text-neutral-text-strong": item.isActive(),
              }
            )}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-neutral-text-strong": item.isActive(),
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
              "grid h-7 w-7 place-items-center rounded text-neutral-text-medium hover:bg-neutral-component-surface-dark",
              {
                "bg-neutral-component-surface-dark text-neutral-text-strong": item.isActive(),
              }
            )}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-neutral-text-strong": item.isActive(),
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
              "grid h-7 w-7 place-items-center rounded text-neutral-text-medium hover:bg-neutral-component-surface-dark",
              {
                "bg-neutral-component-surface-dark text-neutral-text-strong": item.isActive(),
              }
            )}
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-neutral-text-strong": item.isActive(),
              })}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
