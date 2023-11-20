import { Editor } from "@tiptap/react";
import { BoldIcon, Heading1, Heading2, Heading3 } from "lucide-react";

import { BoldItem, BulletListItem, cn, CodeItem, ImageItem, ItalicItem, NumberedListItem, QuoteItem, StrikeThroughItem, TableItem, UnderLineItem, HeadingOneItem, HeadingTwoItem, HeadingThreeItem } from "@plane/editor-core";
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
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
}

export const FixedMenu = (props: EditorBubbleMenuProps) => {
  const basicMarkItems: BubbleMenuItem[] = [
    HeadingOneItem(props.editor),
    HeadingTwoItem(props.editor),
    HeadingThreeItem(props.editor),
    BoldItem(props.editor),
    ItalicItem(props.editor),
    UnderLineItem(props.editor),
    StrikeThroughItem(props.editor),
  ];

  const listItems: BubbleMenuItem[] = [
    BulletListItem(props.editor),
    NumberedListItem(props.editor),
  ];

  const userActionItems: BubbleMenuItem[] = [
    QuoteItem(props.editor),
    CodeItem(props.editor),
  ];

  const complexItems: BubbleMenuItem[] = [
    TableItem(props.editor),
    ImageItem(props.editor, props.uploadFile, props.setIsSubmitting),
  ];

  // const handleAccessChange = (accessKey: string) => {
  //   props.commentAccessSpecifier?.onAccessChange(accessKey);
  // };


  return (
    <div
      className="flex w-fit rounded bg-custom-background-100"
    >
      <div className="flex">
        {basicMarkItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={item.command}
            className={cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive(),
              }
            )}
          >
            <item.icon
              size={ item.icon === Heading1 || item.icon === Heading2 || item.icon === Heading3 ? 20 : 15}
              className={cn({
                "text-custom-text-100": item.isActive(),
              })}
            />
          </button>
        ))}
      </div>
      <div className="flex">
        {listItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={item.command}
            className={cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive(),
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
      <div className="flex">
        {userActionItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={item.command}
            className={cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive(),
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
      <div className="flex">
        {complexItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={item.command}
            className={cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive(),
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
