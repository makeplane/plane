import { Editor } from "@tiptap/react";

import {
  BoldItem,
  BulletListItem,
  cn,
  CodeItem,
  findTableAncestor,
  ImageItem,
  isCellSelection,
  ItalicItem,
  LucideIconType,
  NumberedListItem,
  QuoteItem,
  StrikeThroughItem,
  TableItem,
  UnderLineItem,
  UploadImage,
} from "@plane/editor-core";
import { Tooltip } from "@plane/ui";

export interface BubbleMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: LucideIconType;
}

type EditorBubbleMenuProps = {
  editor: Editor;
  commentAccessSpecifier?: {
    accessValue: string;
    onAccessChange: (accessKey: string) => void;
    showAccessSpecifier: boolean;
    commentAccess:
      | {
          icon: any;
          key: string;
          label: "Private" | "Public";
        }[]
      | undefined;
  };
  uploadFile: UploadImage;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  submitButton: React.ReactNode;
};

export const FixedMenu = (props: EditorBubbleMenuProps) => {
  const basicTextFormattingItems: BubbleMenuItem[] = [
    BoldItem(props.editor),
    ItalicItem(props.editor),
    UnderLineItem(props.editor),
    StrikeThroughItem(props.editor),
  ];

  const listFormattingItems: BubbleMenuItem[] = [BulletListItem(props.editor), NumberedListItem(props.editor)];

  const userActionItems: BubbleMenuItem[] = [QuoteItem(props.editor), CodeItem(props.editor)];

  function getComplexItems(): BubbleMenuItem[] {
    const items: BubbleMenuItem[] = [TableItem(props.editor)];

    if (shouldShowImageItem()) {
      items.push(ImageItem(props.editor, props.uploadFile, props.setIsSubmitting));
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

  const handleAccessChange = (accessKey: string) => {
    props.commentAccessSpecifier?.onAccessChange(accessKey);
  };

  return (
    <div className="flex h-9 w-full items-stretch gap-1.5 overflow-x-scroll">
      {props.commentAccessSpecifier && (
        <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[0.5px] border-custom-border-200 p-1">
          {props?.commentAccessSpecifier.commentAccess?.map((access) => (
            <Tooltip key={access.key} tooltipContent={access.label}>
              <button
                type="button"
                onClick={() => handleAccessChange(access.key)}
                className={`grid aspect-square place-items-center rounded-sm p-1 hover:bg-custom-background-90 ${
                  props.commentAccessSpecifier?.accessValue === access.key ? "bg-custom-background-90" : ""
                }`}
              >
                <access.icon
                  className={`h-3.5 w-3.5 ${
                    props.commentAccessSpecifier?.accessValue === access.key
                      ? "text-custom-text-100"
                      : "text-custom-text-400"
                  }`}
                  strokeWidth={2}
                />
              </button>
            </Tooltip>
          ))}
        </div>
      )}
      <div className="flex w-full items-stretch justify-between gap-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 p-1">
        <div className="flex items-stretch">
          <div className="flex items-stretch gap-0.5 border-r border-custom-border-200 pr-2.5">
            {basicTextFormattingItems.map((item) => (
              <Tooltip key={item.name} tooltipContent={<span className="capitalize">{item.name}</span>}>
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "grid aspect-square place-items-center rounded-sm p-1 text-custom-text-400 hover:bg-custom-background-80",
                    {
                      "bg-custom-background-80 text-custom-text-100": item.isActive(),
                    }
                  )}
                >
                  <item.icon
                    className={cn("h-3.5 w-3.5", {
                      "text-custom-text-100": item.isActive(),
                    })}
                    strokeWidth={2.5}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-stretch gap-0.5 border-r border-custom-border-200 px-2.5">
            {listFormattingItems.map((item) => (
              <Tooltip key={item.name} tooltipContent={<span className="capitalize">{item.name}</span>}>
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "grid aspect-square place-items-center rounded-sm p-1 text-custom-text-400 hover:bg-custom-background-80",
                    {
                      "bg-custom-background-80 text-custom-text-100": item.isActive(),
                    }
                  )}
                >
                  <item.icon
                    className={cn("h-3.5 w-3.5", {
                      "text-custom-text-100": item.isActive(),
                    })}
                    strokeWidth={2.5}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-stretch gap-0.5 border-r border-custom-border-200 px-2.5">
            {userActionItems.map((item) => (
              <Tooltip key={item.name} tooltipContent={<span className="capitalize">{item.name}</span>}>
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "grid aspect-square place-items-center rounded-sm p-1 text-custom-text-400 hover:bg-custom-background-80",
                    {
                      "bg-custom-background-80 text-custom-text-100": item.isActive(),
                    }
                  )}
                >
                  <item.icon
                    className={cn("h-3.5 w-3.5", {
                      "text-custom-text-100": item.isActive(),
                    })}
                    strokeWidth={2.5}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-stretch gap-0.5 pl-2.5">
            {complexItems.map((item) => (
              <Tooltip key={item.name} tooltipContent={<span className="capitalize">{item.name}</span>}>
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "grid aspect-square place-items-center rounded-sm p-1 text-custom-text-400 hover:bg-custom-background-80",
                    {
                      "bg-custom-background-80 text-custom-text-100": item.isActive(),
                    }
                  )}
                >
                  <item.icon
                    className={cn("h-3.5 w-3.5", {
                      "text-custom-text-100": item.isActive(),
                    })}
                    strokeWidth={2.5}
                  />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="sticky right-1">{props.submitButton}</div>
      </div>
    </div>
  );
};
