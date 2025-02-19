import { BubbleMenu, BubbleMenuProps, Editor, isNodeSelection, useEditorState } from "@tiptap/react";
import { FC, useEffect, useState, useRef } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import {
  BackgroundColorItem,
  BoldItem,
  BubbleMenuColorSelector,
  BubbleMenuLinkSelector,
  BubbleMenuNodeSelector,
  CodeItem,
  ItalicItem,
  StrikeThroughItem,
  TextAlignItem,
  TextColorItem,
  UnderLineItem,
} from "@/components/menus";
// constants
import { COLORS_LIST } from "@/constants/common";
// extensions
import { isCellSelection } from "@/extensions/table/table/utilities/is-cell-selection";
// local components
import { TextAlignmentSelector } from "./alignment-selector";

type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children">;

export interface EditorStateType {
  code: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  left: boolean;
  right: boolean;
  center: boolean;
  color: { key: string; label: string; textColor: string; backgroundColor: string } | undefined;
  backgroundColor:
    | {
        key: string;
        label: string;
        textColor: string;
        backgroundColor: string;
      }
    | undefined;
}

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props: { editor: Editor }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const formattingItems = {
    code: CodeItem(props.editor),
    bold: BoldItem(props.editor),
    italic: ItalicItem(props.editor),
    underline: UnderLineItem(props.editor),
    strike: StrikeThroughItem(props.editor),
    textAlign: TextAlignItem(props.editor),
  };

  const editorState: EditorStateType = useEditorState({
    editor: props.editor,
    selector: ({ editor }: { editor: Editor }) => ({
      code: formattingItems.code.isActive(),
      bold: formattingItems.bold.isActive(),
      italic: formattingItems.italic.isActive(),
      underline: formattingItems.underline.isActive(),
      strike: formattingItems.strike.isActive(),
      left: formattingItems.textAlign.isActive({ alignment: "left" }),
      right: formattingItems.textAlign.isActive({ alignment: "right" }),
      center: formattingItems.textAlign.isActive({ alignment: "center" }),
      color: COLORS_LIST.find((c) => TextColorItem(editor).isActive({ color: c.key })),
      backgroundColor: COLORS_LIST.find((c) => BackgroundColorItem(editor).isActive({ color: c.key })),
    }),
  });

  const basicFormattingOptions = editorState.code
    ? [formattingItems.code]
    : [formattingItems.bold, formattingItems.italic, formattingItems.underline, formattingItems.strike];

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
      duration: [300, 0],
      onHidden: () => {
        setIsNodeSelectorOpen(false);
        setIsLinkSelectorOpen(false);
        setIsColorSelectorOpen(false);
      },
    },
  };

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;

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
  }, [props.editor]);

  return (
    <BubbleMenu {...bubbleMenuProps}>
      {!isSelecting && (
        <div
          ref={menuRef}
          className="flex py-2 divide-x divide-custom-border-200 rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg"
        >
          <div className="px-2">
            <BubbleMenuNodeSelector
              editor={props.editor!}
              isOpen={isNodeSelectorOpen}
              setIsOpen={() => {
                setIsNodeSelectorOpen((prev) => !prev);
                setIsLinkSelectorOpen(false);
                setIsColorSelectorOpen(false);
              }}
            />
          </div>
          {!editorState.code && (
            <div className="px-2">
              <BubbleMenuLinkSelector
                editor={props.editor}
                isOpen={isLinkSelectorOpen}
                setIsOpen={() => {
                  setIsLinkSelectorOpen((prev) => !prev);
                  setIsNodeSelectorOpen(false);
                  setIsColorSelectorOpen(false);
                }}
              />
            </div>
          )}
          {!editorState.code && (
            <div className="px-2">
              <BubbleMenuColorSelector
                editor={props.editor}
                isOpen={isColorSelectorOpen}
                editorState={editorState}
                setIsOpen={() => {
                  setIsColorSelectorOpen((prev) => !prev);
                  setIsNodeSelectorOpen(false);
                  setIsLinkSelectorOpen(false);
                }}
              />
            </div>
          )}
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
                    "bg-custom-background-80 text-custom-text-100": editorState[item.key],
                  }
                )}
              >
                <item.icon className="size-4" />
              </button>
            ))}
          </div>
          <TextAlignmentSelector editor={props.editor} editorState={editorState} />
        </div>
      )}
    </BubbleMenu>
  );
};
