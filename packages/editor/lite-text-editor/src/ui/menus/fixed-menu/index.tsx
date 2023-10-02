import { Editor } from "@tiptap/react";
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon } from "lucide-react";

import { cn } from "@plane/editor-core";
import { Icon } from "./icon";
import { Tooltip } from "@/ui/tooltip";

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
}

export const FixedMenu = (props: EditorBubbleMenuProps) => {
  const items: BubbleMenuItem[] = [
    {
      name: "bold",
      isActive: () => props.editor?.isActive("bold"),
      command: () => props.editor?.chain().focus().toggleBold().run(),
      icon: BoldIcon,
    },
    {
      name: "italic",
      isActive: () => props.editor?.isActive("italic"),
      command: () => props.editor?.chain().focus().toggleItalic().run(),
      icon: ItalicIcon,
    },
    {
      name: "underline",
      isActive: () => props.editor?.isActive("underline"),
      command: () => props.editor?.chain().focus().toggleUnderline().run(),
      icon: UnderlineIcon,
    },
    {
      name: "strike",
      isActive: () => props.editor?.isActive("strike"),
      command: () => props.editor?.chain().focus().toggleStrike().run(),
      icon: StrikethroughIcon,
    },
    {
      name: "code",
      isActive: () => props.editor?.isActive("code"),
      command: () => props.editor?.chain().focus().toggleCode().run(),
      icon: CodeIcon,
    },
  ];

  const handleAccessChange = (accessKey: string) => {
    props.commentAccessSpecifier?.onAccessChange(accessKey);
  };


  return (
    <div
      className="flex w-fit divide-x divide-custom-border-300 rounded border border-custom-border-300 bg-custom-background-100 shadow-xl"
    >
      <div className="flex">
        {props.commentAccessSpecifier && (<div className="flex border border-custom-border-300 divide-x divide-custom-border-300 rounded overflow-hidden">
          {props?.commentAccessSpecifier.commentAccess?.map((access) => (
            <Tooltip key={access.key} tooltipContent={access.label}>
              <button
                type="button"
                onClick={() => handleAccessChange(access.key)}
                className={`grid place-items-center p-1 hover:bg-custom-background-80 ${props.commentAccessSpecifier?.accessValue === access.key ? "bg-custom-background-80" : ""
                  }`}
              >
                <Icon
                  iconName={access.icon}
                  className={`w-4 h-4 -mt-1 ${props.commentAccessSpecifier?.accessValue === access.key
                    ? "!text-custom-text-100"
                    : "!text-custom-text-400"
                    }`}
                />
              </button>
            </Tooltip>
          ))}
        </div>)}
        {items.map((item, index) => (
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
