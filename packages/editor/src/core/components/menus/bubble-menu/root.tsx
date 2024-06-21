import { FC, useEffect, useState } from "react";
import { BubbleMenu, BubbleMenuProps, isNodeSelection } from "@tiptap/react";
import { LucideIcon } from "lucide-react";
// components
import {
  BoldItem,
  BubbleMenuLinkSelector,
  BubbleMenuNodeSelector,
  CodeItem,
  ItalicItem,
  StrikeThroughItem,
  UnderLineItem,
} from "@/components/menus";
// extensions
import { isCellSelection } from "@/extensions/table/table/utilities/is-cell-selection";
// helpers
import { cn } from "@/helpers/common";

export interface BubbleMenuItem {
  key: string;
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: LucideIcon;
}

type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children">;

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props: any) => {
  const items: BubbleMenuItem[] = [
    ...(props.editor.isActive("code")
      ? []
      : [
          BoldItem(props.editor),
          ItalicItem(props.editor),
          UnderLineItem(props.editor),
          StrikeThroughItem(props.editor),
        ]),
    CodeItem(props.editor),
  ];

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    shouldShow: ({ state, editor }) => {
      const { selection } = state;

      const { empty } = selection;

      if (
        empty ||
        !editor.isEditable ||
        editor.isActive("image") ||
        isNodeSelection(selection) ||
        isCellSelection(selection) ||
        isSelecting
      ) {
        return false;
      }
      return true;
    },
    tippyOptions: {
      moveTransition: "transform 0.15s ease-out",
      onHidden: () => {
        setIsNodeSelectorOpen(false);
        setIsLinkSelectorOpen(false);
      },
    },
  };

  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);

  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    function handleMouseDown() {
      function handleMouseMove() {
        if (!props.editor.state.selection.empty) {
          setIsSelecting(true);
          document.removeEventListener("mousemove", handleMouseMove);
        }
      }

      function handleMouseUp() {
        setIsSelecting(false);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="flex w-fit divide-x divide-custom-border-300 rounded border border-custom-border-300 bg-custom-background-100 shadow-xl"
    >
      {isSelecting ? null : (
        <>
          {!props.editor.isActive("table") && (
            <BubbleMenuNodeSelector
              editor={props.editor!}
              isOpen={isNodeSelectorOpen}
              setIsOpen={() => {
                setIsNodeSelectorOpen(!isNodeSelectorOpen);
                setIsLinkSelectorOpen(false);
              }}
            />
          )}
          {!props.editor.isActive("code") && (
            <BubbleMenuLinkSelector
              editor={props.editor}
              isOpen={isLinkSelectorOpen}
              setIsOpen={() => {
                setIsLinkSelectorOpen(!isLinkSelectorOpen);
                setIsNodeSelectorOpen(false);
              }}
            />
          )}
          <div className="flex">
            {items.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={(e) => {
                  item.command();
                  e.stopPropagation();
                }}
                className={cn(
                  "p-2 text-custom-text-300 transition-colors hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5",
                  {
                    "bg-custom-primary-100/5 text-custom-text-100": item.isActive(),
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
        </>
      )}
    </BubbleMenu>
  );
};
