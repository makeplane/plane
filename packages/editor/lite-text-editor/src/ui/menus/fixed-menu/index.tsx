import { Editor } from "@tiptap/react";
import { BoldIcon } from "lucide-react";

import {
  BoldItem,
  BulletListItem,
  cn,
  CodeItem,
  ImageItem,
  ItalicItem,
  NumberedListItem,
  QuoteItem,
  StrikeThroughItem,
  TableItem,
  UnderLineItem,
} from "@plane/editor-core";
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
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void;
  submitButton: React.ReactNode;
};

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
    <div className="flex items-stretch gap-1.5 w-full h-9 overflow-x-scroll">
      {props.commentAccessSpecifier && (
        <div className="flex-shrink-0 flex items-stretch gap-0.5 border-[0.5px] border-custom-border-200 rounded p-1">
          {props?.commentAccessSpecifier.commentAccess?.map((access) => (
            <Tooltip key={access.key} tooltipContent={access.label}>
              <button
                type="button"
                onClick={() => handleAccessChange(access.key)}
                className={`aspect-square grid place-items-center p-1 rounded-sm hover:bg-custom-background-90 ${
                  props.commentAccessSpecifier?.accessValue === access.key
                    ? "bg-custom-background-90"
                    : ""
                }`}
              >
                <access.icon
                  className={`w-3.5 h-3.5 ${
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
      <div className="flex items-stretch justify-between gap-2 w-full border-[0.5px] border-custom-border-200 bg-custom-background-90 rounded p-1">
        <div className="flex items-stretch">
          <div className="flex items-stretch gap-0.5 pr-2.5 border-r border-custom-border-200">
            {basicMarkItems.map((item, index) => (
              <Tooltip
                key={index}
                tooltipContent={<span className="capitalize">{item.name}</span>}
              >
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "p-1 aspect-square text-custom-text-400 hover:bg-custom-background-80 rounded-sm grid place-items-center",
                    {
                      "text-custom-text-100 bg-custom-background-80":
                        item.isActive(),
                    },
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
          <div className="flex items-stretch gap-0.5 px-2.5 border-r border-custom-border-200">
            {listItems.map((item, index) => (
              <Tooltip
                key={index}
                tooltipContent={<span className="capitalize">{item.name}</span>}
              >
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "p-1 aspect-square text-custom-text-400 hover:bg-custom-background-80 rounded-sm grid place-items-center",
                    {
                      "text-custom-text-100 bg-custom-background-80":
                        item.isActive(),
                    },
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
          <div className="flex items-stretch gap-0.5 px-2.5 border-r border-custom-border-200">
            {userActionItems.map((item, index) => (
              <Tooltip
                key={index}
                tooltipContent={<span className="capitalize">{item.name}</span>}
              >
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "p-1 aspect-square text-custom-text-400 hover:bg-custom-background-80 rounded-sm grid place-items-center",
                    {
                      "text-custom-text-100 bg-custom-background-80":
                        item.isActive(),
                    },
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
            {complexItems.map((item, index) => (
              <Tooltip
                key={index}
                tooltipContent={<span className="capitalize">{item.name}</span>}
              >
                <button
                  type="button"
                  onClick={item.command}
                  className={cn(
                    "p-1 aspect-square text-custom-text-400 hover:bg-custom-background-80 rounded-sm grid place-items-center",
                    {
                      "text-custom-text-100 bg-custom-background-80":
                        item.isActive(),
                    },
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
