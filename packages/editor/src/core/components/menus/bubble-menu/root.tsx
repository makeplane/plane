import { FC, useEffect, useState } from "react";
import { BubbleMenu, BubbleMenuProps, Editor, isNodeSelection } from "@tiptap/react";
// components
import {
  BoldItem,
  BubbleMenuColorSelector,
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
// local components
import { TextAlignmentSelector } from "./alignment-selector";

type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children">;

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props: any) => {
  // states
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const basicFormattingOptions = props.editor.isActive("code")
    ? [CodeItem(props.editor)]
    : [BoldItem(props.editor), ItalicItem(props.editor), UnderLineItem(props.editor), StrikeThroughItem(props.editor)];

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
        setIsColorSelectorOpen(false);
      },
    },
  };

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
      className="flex py-2 divide-x divide-custom-border-200 rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg"
    >
      {!isSelecting && (
        <>
          <div className="px-2">
            {!props.editor.isActive("table") && (
              <BubbleMenuNodeSelector
                editor={props.editor!}
                isOpen={isNodeSelectorOpen}
                setIsOpen={() => {
                  setIsNodeSelectorOpen((prev) => !prev);
                  setIsLinkSelectorOpen(false);
                  setIsColorSelectorOpen(false);
                }}
              />
            )}
          </div>
          <div className="px-2">
            {!props.editor.isActive("code") && (
              <BubbleMenuLinkSelector
                editor={props.editor}
                isOpen={isLinkSelectorOpen}
                setIsOpen={() => {
                  setIsLinkSelectorOpen((prev) => !prev);
                  setIsNodeSelectorOpen(false);
                  setIsColorSelectorOpen(false);
                }}
              />
            )}
          </div>
          <div className="px-2">
            {!props.editor.isActive("code") && (
              <BubbleMenuColorSelector
                editor={props.editor}
                isOpen={isColorSelectorOpen}
                setIsOpen={() => {
                  setIsColorSelectorOpen((prev) => !prev);
                  setIsNodeSelectorOpen(false);
                  setIsLinkSelectorOpen(false);
                }}
              />
            )}
          </div>
          <div className="flex gap-0.5 px-2">
            {basicFormattingOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={(e) => {
                  item.command();
                  e.stopPropagation();
                }}
                className={cn(
                  "size-7 grid place-items-center rounded text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 transition-colors",
                  {
                    "bg-custom-background-80 text-custom-text-100": item.isActive(""),
                  }
                )}
              >
                <item.icon className="size-4" />
              </button>
            ))}
          </div>
          <TextAlignmentSelector
            editor={props.editor}
            onClose={() => {
              const editor = props.editor as Editor;
              if (!editor) return;
              const pos = editor.state.selection.to;
              editor.commands.setTextSelection(pos ?? 0);
            }}
          />
        </>
      )}
    </BubbleMenu>
  );
};
