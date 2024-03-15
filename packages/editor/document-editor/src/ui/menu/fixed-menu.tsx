import {
  BoldItem,
  BulletListItem,
  cn,
  CodeItem,
  EditorMenuItem,
  HeadingOneItem,
  HeadingThreeItem,
  HeadingTwoItem,
  ImageItem,
  ItalicItem,
  NumberedListItem,
  QuoteItem,
  StrikeThroughItem,
  TableItem,
  UnderLineItem,
  UploadImage,
} from "@plane/editor-document-core";
import { Editor } from "@tiptap/react";

export type BubbleMenuItem = EditorMenuItem;

type EditorBubbleMenuProps = {
  editor: Editor;
  uploadFile: UploadImage;
};

export const FixedMenu = (props: EditorBubbleMenuProps) => {
  const { editor, uploadFile } = props;

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

    items.push(ImageItem(editor, uploadFile));
    return items;
  }

  const complexItems: BubbleMenuItem[] = getComplexItems();

  return (
    <div className="flex flex-wrap items-center divide-x divide-custom-border-200">
      <div className="flex items-center gap-0.5 pr-2">
        {basicMarkItems.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={item.command}
            className={cn(
              "grid h-7 w-7 place-items-center rounded text-custom-text-300 hover:bg-custom-background-80",
              {
                "bg-custom-background-80 text-custom-text-100": item.isActive(),
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
              "grid h-7 w-7 place-items-center rounded text-custom-text-300 hover:bg-custom-background-80",
              {
                "bg-custom-background-80 text-custom-text-100": item.isActive(),
              }
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
              "grid h-7 w-7 place-items-center rounded text-custom-text-300 hover:bg-custom-background-80",
              {
                "bg-custom-background-80 text-custom-text-100": item.isActive(),
              }
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
              "grid h-7 w-7 place-items-center rounded text-custom-text-300 hover:bg-custom-background-80",
              {
                "bg-custom-background-80 text-custom-text-100": item.isActive(),
              }
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
