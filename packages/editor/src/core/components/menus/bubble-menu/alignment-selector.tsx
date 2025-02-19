import { Editor } from "@tiptap/core";
import { AlignCenter, AlignLeft, AlignRight, LucideIcon } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";
// components
import { TextAlignItem } from "@/components/menus";
// types
import { TEditorCommands } from "@/types";
import { EditorStateType } from "./root";

type Props = {
  editor: Editor;
  editorState: EditorStateType;
};

export const TextAlignmentSelector: React.FC<Props> = (props) => {
  const { editor, editorState } = props;
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
      isActive: () => editorState.left,
    },
    {
      itemKey: "text-align",
      renderKey: "text-align-center",
      icon: AlignCenter,
      command: () =>
        menuItem.command({
          alignment: "center",
        }),
      isActive: () => editorState.center,
    },
    {
      itemKey: "text-align",
      renderKey: "text-align-right",
      icon: AlignRight,
      command: () =>
        menuItem.command({
          alignment: "right",
        }),
      isActive: () => editorState.right,
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
