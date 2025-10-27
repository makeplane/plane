import { type Editor, isNodeSelection } from "@tiptap/core";
import { BubbleMenu, type BubbleMenuProps, useEditorState } from "@tiptap/react";
import { FC, useEffect, useState, useRef } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import {
  BackgroundColorItem,
  BoldItem,
  BubbleMenuColorSelector,
  BubbleMenuNodeSelector,
  CodeItem,
  EditorMenuItem,
  ItalicItem,
  StrikeThroughItem,
  TextAlignItem,
  TextColorItem,
  UnderLineItem,
} from "@/components/menus";
// constants
import { COLORS_LIST } from "@/constants/common";
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { isCellSelection } from "@/extensions/table/table/utilities/helpers";
// types
import type { TEditorCommands } from "@/types";
// local imports
import { TextAlignmentSelector } from "./alignment-selector";
import { BubbleMenuLinkSelector } from "./link-selector";

type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children">;

export type EditorStateType = {
  code: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  left: boolean;
  right: boolean;
  center: boolean;
  color:
    | {
        key: string;
        label: string;
        textColor: string;
        backgroundColor: string;
      }
    | undefined;
  backgroundColor:
    | {
        key: string;
        label: string;
        textColor: string;
        backgroundColor: string;
      }
    | undefined;
};

type Props = {
  editor: Editor;
};

export const EditorBubbleMenu: FC<Props> = (props) => {
  const { editor } = props;
  // states
  const [isSelecting, setIsSelecting] = useState(false);
  // refs
  const menuRef = useRef<HTMLDivElement>(null);

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
    editor,
    selector: ({ editor }) => ({
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

  const bubbleMenuProps: EditorBubbleMenuProps = {
    editor,
    shouldShow: ({ state, editor }) => {
      const { selection } = state;
      const { empty } = selection;

      if (
        empty ||
        !editor.isEditable ||
        editor.isActive(CORE_EXTENSIONS.IMAGE) ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE) ||
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
      zIndex: 9,
      onShow: () => {
        if (editor.storage.link) {
          editor.storage.link.isBubbleMenuOpen = true;
        }
        editor.commands.addActiveDropbarExtension("bubble-menu");
      },
      onHide: () => {
        if (editor.storage.link) {
          editor.storage.link.isBubbleMenuOpen = false;
        }
        setTimeout(() => {
          editor.commands.removeActiveDropbarExtension("bubble-menu");
        }, 0);
      },
      onHidden: () => {
        if (editor.storage.link) {
          editor.storage.link.isBubbleMenuOpen = false;
        }
        setTimeout(() => {
          editor.commands.removeActiveDropbarExtension("bubble-menu");
        }, 0);
      },
    },
  };

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;

      function handleMouseMove() {
        if (!editor.state.selection.empty) {
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
  }, [editor]);

  return (
    <BubbleMenu {...bubbleMenuProps}>
      {!isSelecting && (
        <div
          ref={menuRef}
          className="flex py-2 divide-x divide-custom-border-200 rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg overflow-x-scroll horizontal-scrollbar scrollbar-xs"
        >
          <div className="px-2">
            <BubbleMenuNodeSelector editor={editor} />
          </div>
          {!editorState.code && (
            <div className="px-2">
              <BubbleMenuLinkSelector editor={editor} />
            </div>
          )}
          {!editorState.code && (
            <div className="px-2">
              <BubbleMenuColorSelector editor={editor} editorState={editorState} />
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
          <TextAlignmentSelector editor={editor} editorState={editorState} />
        </div>
      )}
    </BubbleMenu>
  );
};
