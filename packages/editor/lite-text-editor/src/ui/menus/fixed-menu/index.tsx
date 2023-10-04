import { Editor } from "@tiptap/react";
import { BoldIcon } from "lucide-react";

import { BoldItem, BulletListItem, cn, CodeItem, ImageItem, ItalicItem, NumberedListItem, QuoteItem, StrikeThroughItem, TableItem, UnderLineItem } from "@plane/editor-core";
import { Icon } from "./icon";
import { Tooltip } from "../../tooltip";
import { UploadImage } from "../..";

export interface BubbleMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

type EditorBubbleMenuProps = {
  editor: Editor;
  commentAccessSpecifier?: {
    accessValue: string,
    onAccessChange: (accessKey: string) => void,
    showAccessSpecifier: boolean,
    commentAccess: {
      icon: string;
      key: string;
      label: "Private" | "Public";
    }[] | undefined;
  }
  uploadFile: UploadImage;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
}

export const FixedMenu = (props: EditorBubbleMenuProps) => {
  const basicMarkItems: BubbleMenuItem[] = [
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

  const handleAccessChange = (accessKey: string) => {
    props.commentAccessSpecifier?.onAccessChange(accessKey);
  };


  return (
    <div
      className="flex w-fit divide-x divide-custom-border-300 rounded border border-custom-border-300 bg-custom-background-100 shadow-xl"
    >
      {props.commentAccessSpecifier && (<div className="flex border border-custom-border-300 mt-0 divide-x divide-custom-border-300 rounded overflow-hidden">
        {props?.commentAccessSpecifier.commentAccess?.map((access) => (
          <Tooltip key={access.key} tooltipContent={access.label}>
            <button
              type="button"
              onClick={() => handleAccessChange(access.key)}
              className={`grid place-basicMarkItems-center p-1 hover:bg-custom-background-80 ${props.commentAccessSpecifier?.accessValue === access.key ? "bg-custom-background-80" : ""
                }`}
            >
              <Icon
                iconName={access.icon}
                className={`w-4 h-4 ${props.commentAccessSpecifier?.accessValue === access.key
                  ? "!text-custom-text-100"
                  : "!text-custom-text-400"
                  }`}
              />
            </button>
          </Tooltip>
        ))}
      </div>)}
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
              className={cn("h-4 w-4", {
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
