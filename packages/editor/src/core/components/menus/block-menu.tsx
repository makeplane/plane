/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CopyIcon, TrashIcon, LinkIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn, copyUrlToClipboard } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { generateUniqueID, UniqueIDAttribute } from "@/extensions/unique-id/extension";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// hooks
import { useBlockMenu } from "@/plane-editor/hooks/use-block-menu";
// types
import { EExternalEmbedAttributeNames } from "@/types";
import type { IEditorProps, IEditorPropsExtended } from "@/types";
// components
import { getNodeOptions } from "./block-menu-options";
import type { LucideIcon } from "lucide-react";

type Props = {
  disabledExtensions?: IEditorProps["disabledExtensions"];
  editor: Editor;
  flaggedExtensions?: IEditorProps["flaggedExtensions"];
  originUrl?: IEditorPropsExtended["originUrl"];
};
export type BlockMenuOption = {
  icon: LucideIcon | React.FC<ISvgIcons>;
  key: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  isDisabled?: boolean;
};

export type MenuItem = {
  icon: LucideIcon | React.FC<ISvgIcons>;
  key: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  isDisabled?: boolean;
};

const stripCommentMarksFromJSON = (node: JSONContent | null | undefined): JSONContent | null | undefined => {
  if (!node) return node;

  const sanitizedNode: JSONContent = { ...node };

  if (sanitizedNode.marks) {
    const filteredMarks = sanitizedNode.marks.filter((mark) => mark.type !== ADDITIONAL_EXTENSIONS.COMMENTS);
    if (filteredMarks.length > 0) {
      sanitizedNode.marks = filteredMarks.map((mark) => ({ ...mark }));
    } else {
      delete sanitizedNode.marks;
    }
  }

  if (sanitizedNode.content) {
    sanitizedNode.content = sanitizedNode.content
      .map((child) => stripCommentMarksFromJSON(child))
      .filter((child): child is JSONContent => Boolean(child));
  }

  return sanitizedNode;
};

export function BlockMenu(props: Props) {
  const { editor, flaggedExtensions, disabledExtensions, originUrl } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const virtualReferenceRef = useRef<{ getBoundingClientRect: () => DOMRect }>({
    getBoundingClientRect: () => new DOMRect(),
  });
  // const { t } = useTranslation();

  const { menuItems: additionalMenuItems } = useBlockMenu({
    editor,
    flaggedExtensions: flaggedExtensions,
    disabledExtensions: disabledExtensions,
    onMenuClose: () => setIsOpen(false),
  });

  // Set up Floating UI with virtual reference element
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset({ crossAxis: -10 }), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "left-start",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const openBlockMenu = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.SIDE_MENU);
    }
  }, [editor, isOpen]);

  const closeBlockMenu = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      editor.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.SIDE_MENU);
    }
  }, [editor, isOpen]);

  // Handle click on drag handle
  const handleClickDragHandle = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dragHandle = target.closest("#drag-handle");

      if (dragHandle) {
        event.preventDefault();

        // Update virtual reference with current drag handle position
        virtualReferenceRef.current = {
          getBoundingClientRect: () => dragHandle.getBoundingClientRect(),
        };

        // Set the virtual reference as the reference element
        refs.setReference(virtualReferenceRef.current);

        // Show the menu
        openBlockMenu();
        return;
      }

      // If clicking outside and not on a menu item, hide the menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        closeBlockMenu();
      }
    },
    [refs, openBlockMenu, closeBlockMenu]
  );

  // Set up event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBlockMenu();
      }
    };

    const handleScroll = () => {
      closeBlockMenu();
    };

    document.addEventListener("click", handleClickDragHandle);
    document.addEventListener("contextmenu", handleClickDragHandle);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleClickDragHandle);
      document.removeEventListener("contextmenu", handleClickDragHandle);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [editor.commands, handleClickDragHandle, closeBlockMenu]);

  // Animation effect
  useEffect(() => {
    if (isOpen) {
      setIsAnimatedIn(false);
      // Add a small delay before starting the animation
      const timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsAnimatedIn(true);
        });
      }, 50);

      return () => clearTimeout(timeout);
    } else {
      setIsAnimatedIn(false);
    }
  }, [isOpen]);

  const MENU_ITEMS: BlockMenuOption[] = [
    {
      icon: LinkIcon,
      key: "copy-link",
      label: "Copy link",
      isDisabled: disabledExtensions?.includes("copy-block-link"),
      onClick: () => {
        const { selection, tr } = editor.state;
        const selectedNode = selection.content().content.firstChild;
        let nodeId = selectedNode?.attrs?.[UniqueIDAttribute];
        if (!nodeId) {
          nodeId = generateUniqueID();
          tr.setNodeMarkup(selection.from, undefined, {
            ...selectedNode?.attrs,
            [UniqueIDAttribute]: nodeId,
          });
        }
        tr.setMeta("addToHistory", false);
        editor.view.dispatch(tr);

        let urlToCopy: string;
        const currentPageUrl = window.location.href.split("#")[0];
        const baseWorkItemUrl = originUrl;
        if (baseWorkItemUrl) {
          urlToCopy = nodeId ? `${baseWorkItemUrl}#${nodeId}` : baseWorkItemUrl;
        } else {
          urlToCopy = nodeId ? `${currentPageUrl}#${nodeId}` : currentPageUrl;
        }

        copyUrlToClipboard(urlToCopy).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: "Link copied to clipboard.",
          });
        });
      },
    },
    {
      icon: TrashIcon,
      key: "delete",
      label: "Delete",
      onClick: (_e) => {
        // Execute the delete action
        editor.chain().deleteSelection().focus().run();
      },
    },
    {
      icon: CopyIcon,
      key: "duplicate",
      label: "Duplicate",
      isDisabled:
        editor.state.selection.content().content.firstChild?.type.name === CORE_EXTENSIONS.IMAGE ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE) ||
        editor.isActive(ADDITIONAL_EXTENSIONS.DRAWIO) ||
        editor.isActive(ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT),
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const { state } = editor;
          const { selection } = state;
          const firstChild = selection.content().content.firstChild;
          const docSize = state.doc.content.size;
          if (!firstChild) {
            throw new Error("No content selected or content is not duplicable.");
          }
          const insertPos = selection.to;
          if (insertPos < 0 || insertPos > docSize) {
            throw new Error("The insertion position is invalid or outside the document.");
          }
          const contentToInsert = stripCommentMarksFromJSON(firstChild.toJSON() as JSONContent) as JSONContent;
          if (contentToInsert.type === ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED) {
            return editor
              .chain()
              .insertExternalEmbed({
                [EExternalEmbedAttributeNames.IS_RICH_CARD]:
                  contentToInsert.attrs?.[EExternalEmbedAttributeNames.IS_RICH_CARD],
                [EExternalEmbedAttributeNames.SOURCE]: contentToInsert.attrs?.src,
                pos: insertPos,
              })
              .focus(Math.min(insertPos + 1, docSize), { scrollIntoView: false })
              .run();
          } else if (contentToInsert.type === ADDITIONAL_EXTENSIONS.BLOCK_MATH) {
            return editor
              .chain()
              .setBlockMath({
                latex: contentToInsert.attrs?.latex,
                pos: insertPos,
              })
              .focus(Math.min(insertPos + 1, docSize), { scrollIntoView: false })
              .run();
          }
          editor
            .chain()
            .insertContentAt(insertPos, contentToInsert, {
              updateSelection: true,
            })
            .focus(Math.min(insertPos + 1, docSize), { scrollIntoView: false })
            .run();
        } catch (error) {
          if (error instanceof Error) {
            console.error(error.message);
          }
        }
      },
    },
    ...getNodeOptions(editor),
  ];

  const ALL_MENU_ITEMS = [...additionalMenuItems, ...MENU_ITEMS];

  if (!isOpen) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={(node) => {
          refs.setFloating(node);
          menuRef.current = node;
        }}
        style={{
          ...floatingStyles,
          animationFillMode: "forwards",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Expo ease out
          zIndex: 100,
        }}
        className={cn(
          "max-h-60 min-w-[7rem] overflow-y-scroll rounded-lg border border-subtle bg-surface-1 p-1.5 shadow-raised-200",
          "transition-all duration-300 transform origin-top-right",
          isAnimatedIn ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}
        {...getFloatingProps()}
      >
        {ALL_MENU_ITEMS.map((item) => {
          if (item.isDisabled) return null;

          return (
            <button
              key={item.key}
              type="button"
              className="flex w-full items-center gap-1.5 truncate rounded-sm px-1 py-1.5 text-11 text-secondary hover:bg-layer-1"
              onClick={(e) => {
                item.onClick(e);
                e.preventDefault();
                e.stopPropagation();
                closeBlockMenu();
              }}
              disabled={item.isDisabled}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
              {/* {t(item.label)} */}
            </button>
          );
        })}
      </div>
    </FloatingPortal>
  );
}
