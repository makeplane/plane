import { isNodeSelection, type Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useState } from "react";
import { cn } from "@plane/utils";
import { COLORS_LIST } from "@/constants/common";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { isCellSelection } from "@/extensions/table/table/utilities/is-cell-selection";
import { TEditorCommands } from "@/types";
import {
  TextColorItem,
  BackgroundColorItem,
  BoldItem,
  CodeItem,
  EditorMenuItem,
  ItalicItem,
  StrikeThroughItem,
  TextAlignItem,
  UnderLineItem,
} from "../menu-items";
import { TextAlignmentSelector } from "./alignment-selector";
import { BubbleMenu } from "./bubble-menu-renderer";
import { BubbleMenuColorSelector } from "./color-selector";
import { BubbleMenuLinkSelector } from "./link-selector";
import { BubbleMenuNodeSelector } from "./node-selector";

type EditorBubbleMenuProps = { editor: Editor };

export interface EditorStateType {
  code: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
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

export const EditorBubbleMenu = (bubbleMenuProps: EditorBubbleMenuProps) => {
  const { editor } = bubbleMenuProps;
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);

  const bubbleMenuPropsInternal = {
    shouldShow: ({ state, editor }) => {
      const { selection } = state;
      const { empty } = selection;

      if (
        empty ||
        !editor.isEditable ||
        editor.isActive(CORE_EXTENSIONS.IMAGE) ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE) ||
        isNodeSelection(selection) ||
        isCellSelection(selection)
      ) {
        return false;
      }
      return true;
    },
  };

  const formattingItems = {
    code: CodeItem(editor),
    bold: BoldItem(editor),
    italic: ItalicItem(editor),
    underline: UnderLineItem(editor),
    strikethrough: StrikeThroughItem(editor),
    "text-align": TextAlignItem(editor),
  } satisfies {
    [K in TEditorCommands]?: EditorMenuItem<K>;
  };

  const editorState: EditorStateType = useEditorState({
    editor: editor,
    selector: ({ editor }: { editor: Editor }) => ({
      code: formattingItems.code.isActive(),
      bold: formattingItems.bold.isActive(),
      italic: formattingItems.italic.isActive(),
      underline: formattingItems.underline.isActive(),
      strikethrough: formattingItems.strikethrough.isActive(),
      left: formattingItems["text-align"].isActive({ alignment: "left" }),
      right: formattingItems["text-align"].isActive({ alignment: "right" }),
      center: formattingItems["text-align"].isActive({ alignment: "center" }),
      color: COLORS_LIST.find((c) => TextColorItem(editor).isActive({ color: c.key })),
      backgroundColor: COLORS_LIST.find((c) => BackgroundColorItem(editor).isActive({ color: c.key })),
    }),
  });

  const basicFormattingOptions = editorState.code
    ? [formattingItems.code]
    : [formattingItems.bold, formattingItems.italic, formattingItems.underline, formattingItems.strikethrough];

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top-start",
        offset: 2,
      }}
      shouldShow={bubbleMenuPropsInternal.shouldShow}
    >
      <div
        className={cn(
          "flex items-center divide-x divide-custom-border-200 rounded-md border border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg"
        )}
      >
        <BubbleMenuNodeSelector
          editor={editor}
          isOpen={isNodeSelectorOpen}
          setIsOpen={() => {
            setIsNodeSelectorOpen((prev) => !prev);
            setIsLinkSelectorOpen(false);
            setIsColorSelectorOpen(false);
          }}
        />
        {!editorState.code && (
          <BubbleMenuLinkSelector
            editor={editor}
            isOpen={isLinkSelectorOpen}
            setIsOpen={() => {
              setIsLinkSelectorOpen((prev) => !prev);
              setIsNodeSelectorOpen(false);
              setIsColorSelectorOpen(false);
            }}
          />
        )}
        {!editorState.code && (
          <BubbleMenuColorSelector
            editor={editor}
            isOpen={isColorSelectorOpen}
            editorState={editorState}
            setIsOpen={() => {
              setIsColorSelectorOpen((prev) => !prev);
              setIsNodeSelectorOpen(false);
              setIsLinkSelectorOpen(false);
            }}
          />
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
                "size-7 grid place-items-center rounded text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 transition-all duration-200 ease-in-out",
                {
                  "bg-custom-background-80 text-custom-text-100": editorState[item.key],
                }
              )}
            >
              <item.icon
                className={cn("size-4 transition-transform duration-200", {
                  "text-custom-text-100": editorState[item.key],
                })}
              />
            </button>
          ))}
        </div>
        <TextAlignmentSelector editor={editor} editorState={editorState} />
      </div>
    </BubbleMenu>
  );
};
