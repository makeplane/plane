/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isNodeSelection } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { BubbleMenuProps } from "@tiptap/react/menus";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import type { EditorMenuItem } from "@/components/menus";
import {
  BackgroundColorItem,
  BoldItem,
  BubbleMenuColorSelector,
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
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { isCellSelection } from "@/extensions/table/table/utilities/helpers";
// types
import type { IEditorPropsExtended, TEditorCommands, TExtensions } from "@/types";
// local imports
import { TextAlignmentSelector } from "./alignment-selector";
import { BubbleMenuLinkSelector } from "./link-selector";

// Explicit so the drag handler can address the plugin; BubbleMenu otherwise generates a unique key.
const bubbleMenuPluginKey = new PluginKey("editorBubbleMenu");

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
  disabledExtensions: TExtensions[];
  editor: Editor;
  extendedEditorProps: IEditorPropsExtended;
  flaggedExtensions: TExtensions[];
};

export function EditorBubbleMenu(props: Props) {
  const { editor } = props;
  // states
  const [isSelecting, setIsSelecting] = useState(false);
  // refs
  const menuRef = useRef<HTMLDivElement>(null);
  // read by the plugin's shouldShow, which outlives a render
  const isSelectingRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hideTimerRef.current), [editor]);

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
    selector: ({ editor: currentEditor }) => ({
      code: formattingItems.code.isActive(),
      bold: formattingItems.bold.isActive(),
      italic: formattingItems.italic.isActive(),
      underline: formattingItems.underline.isActive(),
      strikethrough: formattingItems.strikethrough.isActive(),
      left: formattingItems["text-align"].isActive({ alignment: "left" }),
      right: formattingItems["text-align"].isActive({ alignment: "right" }),
      center: formattingItems["text-align"].isActive({ alignment: "center" }),
      color: COLORS_LIST.find((c) => TextColorItem(currentEditor).isActive({ color: c.key })),
      backgroundColor: COLORS_LIST.find((c) => BackgroundColorItem(currentEditor).isActive({ color: c.key })),
    }),
  });

  const basicFormattingOptions = editorState.code
    ? [formattingItems.code]
    : [formattingItems.bold, formattingItems.italic, formattingItems.underline, formattingItems.strikethrough];

  const canShowBubbleMenu = useCallback(() => {
    const { selection } = editor.state;
    const { empty } = selection;

    if (
      empty ||
      !editor.isEditable ||
      editor.isActive(CORE_EXTENSIONS.IMAGE) ||
      editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE) ||
      isNodeSelection(selection) ||
      isCellSelection(selection) ||
      isSelectingRef.current
    ) {
      return false;
    }
    return true;
  }, [editor]);

  // memoized: BubbleMenu re-sends its options to the plugin whenever this object changes
  const options: EditorBubbleMenuProps["options"] = useMemo(
    () => ({
      placement: "top",
      offset: 8,
      onShow: () => {
        clearTimeout(hideTimerRef.current);
        if (editor.isDestroyed) return;
        if (editor.storage.link) {
          editor.storage.link.isBubbleMenuOpen = true;
        }
        editor.commands.addActiveDropbarExtension("bubble-menu");
      },
      onHide: () => {
        if (editor.isDestroyed) return;
        if (editor.storage.link) {
          editor.storage.link.isBubbleMenuOpen = false;
        }
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          if (editor.isDestroyed) return;
          editor.commands.removeActiveDropbarExtension("bubble-menu");
        }, 0);
      },
    }),
    [editor]
  );

  useEffect(() => {
    const doc = editor.view.dom.ownerDocument;
    let showFrame: number | undefined;

    const clearDragListeners = () => {
      doc.removeEventListener("mousemove", handleMouseMove);
      doc.removeEventListener("mouseup", handleMouseUp);
    };
    function handleMouseMove() {
      if (!editor.isDestroyed && !editor.state.selection.empty) {
        isSelectingRef.current = true;
        setIsSelecting(true);
        doc.removeEventListener("mousemove", handleMouseMove);
      }
    }
    function handleMouseUp() {
      const wasSelecting = isSelectingRef.current;
      isSelectingRef.current = false;
      setIsSelecting(false);
      clearDragListeners();
      if (!wasSelecting) return;
      // The selection may stop changing before mouseup, and v3 only re-evaluates on a selection or doc change,
      // so show explicitly once React has restored the menu DOM.
      showFrame = requestAnimationFrame(() => {
        if (!editor.isDestroyed && canShowBubbleMenu()) {
          editor.view.dispatch(editor.state.tr.setMeta(bubbleMenuPluginKey, "show"));
        }
      });
    }
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Portal controls and selections in other editors must not start this editor's drag lifecycle.
      if (e.button !== 0 || !editor.view.dom.contains(target) || menuRef.current?.contains(target)) return;
      cancelAnimationFrame(showFrame ?? 0);
      clearDragListeners();
      doc.addEventListener("mousemove", handleMouseMove);
      doc.addEventListener("mouseup", handleMouseUp);
    }

    doc.addEventListener("mousedown", handleMouseDown);
    return () => {
      doc.removeEventListener("mousedown", handleMouseDown);
      clearDragListeners();
      cancelAnimationFrame(showFrame ?? 0);
      isSelectingRef.current = false;
    };
  }, [editor, canShowBubbleMenu]);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={bubbleMenuPluginKey}
      shouldShow={canShowBubbleMenu}
      options={options}
      style={{ zIndex: 9, transition: "transform 0.15s ease-out" }}
    >
      {!isSelecting && (
        <div
          ref={menuRef}
          className="horizontal-scrollbar flex scrollbar-xs divide-x divide-subtle-1 overflow-x-scroll rounded-lg border border-subtle bg-surface-1 py-2 shadow-raised-200"
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
                  "grid size-7 place-items-center rounded-sm text-tertiary transition-colors hover:bg-layer-1 active:bg-layer-1",
                  {
                    "bg-layer-1 text-primary": editorState[item.key],
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
}
