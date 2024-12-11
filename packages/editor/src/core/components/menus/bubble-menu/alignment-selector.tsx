import { Editor } from "@tiptap/core";
import { AlignCenter, AlignLeft, AlignRight, LucideIcon } from "lucide-react";
// components
import { TextAlignItem } from "@/components/menus";
// helpers
import { cn } from "@/helpers/common";
// types
import { TEditorCommands } from "@/types";

type Props = {
  editor: Editor;
  onClose: () => void;
};

export const TextAlignmentSelector: React.FC<Props> = (props) => {
  const { editor, onClose } = props;

  const menuItem = TextAlignItem(editor);

  const textAlignmentOptions: {
    itemKey: TEditorCommands;
    renderKey: string;
    icon: LucideIcon;
    command: () => void;
    isActive: () => boolean;
  }[] = [
    {
      itemKey: "text-align",
      renderKey: "text-align-left",
      icon: AlignLeft,
      command: () =>
        menuItem.command({
          alignment: "left",
        }),
      isActive: () =>
        menuItem.isActive({
          alignment: "left",
        }),
    },
    {
      itemKey: "text-align",
      renderKey: "text-align-center",
      icon: AlignCenter,
      command: () =>
        menuItem.command({
          alignment: "center",
        }),
      isActive: () =>
        menuItem.isActive({
          alignment: "center",
        }),
    },
    {
      itemKey: "text-align",
      renderKey: "text-align-right",
      icon: AlignRight,
      command: () =>
        menuItem.command({
          alignment: "right",
        }),
      isActive: () =>
        menuItem.isActive({
          alignment: "right",
        }),
    },
  ];

  return (
    <div className="flex gap-0.5 px-2">
      {textAlignmentOptions.map((item) => (
        <button
          key={item.renderKey}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            item.command();
            onClose();
          }}
          className={cn(
            "size-7 grid place-items-center rounded text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 transition-colors",
            {
              "bg-custom-background-80 text-custom-text-100": item.isActive(),
            }
          )}
        >
          <item.icon className="size-4" />
        </button>
      ))}
    </div>
  );
};
