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
import { type Editor, useEditorState } from "@tiptap/react";
import { Copy, LucideIcon, Trash2, Link, Code, Bookmark } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
// plane imports
// import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// constants
import { cn } from "@plane/utils";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EExternalEmbedAttributeNames, IEditorProps } from "@/types";

type Props = {
  editor: Editor;
  flaggedExtensions?: IEditorProps["flaggedExtensions"];
  disabledExtensions?: IEditorProps["disabledExtensions"];
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

export const BlockMenu = (props: Props) => {
  const { editor } = props;
  const menuRef = useRef<HTMLDivElement>(null);
  const popup = useRef<Instance | null>(null);

  const handleClickDragHandle = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.matches("#drag-handle")) {
      event.preventDefault();

      popup.current?.setProps({
        getReferenceClientRect: () => target.getBoundingClientRect(),
      });

      popup.current?.show();
      return;
    }

    popup.current?.hide();
    return;
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.remove();
      menuRef.current.style.visibility = "visible";

      // @ts-expect-error - Tippy types are incorrect
      popup.current = tippy(document.body, {
        getReferenceClientRect: null,
        content: menuRef.current,
        appendTo: () => document.querySelector(".frame-renderer"),
        trigger: "manual",
        interactive: true,
        arrow: false,
        placement: "left-start",
        animation: "shift-away",
        maxWidth: 500,
        hideOnClick: true,
        onShown: () => {
          menuRef.current?.focus();
        },
      });
    }

    return () => {
      popup.current?.destroy();
      popup.current = null;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = () => {
      popup.current?.hide();
    };

    const handleScroll = () => {
      setIsOpen(false);
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
  }, [handleClickDragHandle]);

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

  const MENU_ITEMS: {
    icon: LucideIcon;
    key: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    isDisabled?: boolean;
  }[] = [
    {
      icon: Link,
      key: "link",
      label: "Convert to Link",
      // label: "externalEmbedComponent.block_menu.convert_to_link",
      isDisabled: !editorState.isEmbedActive || !editorState.linkUrl || isEmbedFlagged,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { state } = editor;
        const { selection } = state;
        const node = selection.content().content.firstChild;
        if (node?.type.name === ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED) {
          const LinkValue = node.attrs.src;
          editor
            .chain()
            .insertContentAt(selection, {
              type: "text",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: LinkValue,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                },
              ],
              text: LinkValue,
            })
            .run();
        }
        setIsOpen(false);
      },
    },
    {
      icon: Code,
      key: "embed",
      label: "Convert to Embed",
      // label: "externalEmbedComponent.block_menu.convert_to_embed",
      isDisabled:
        editorState.isNotEmbeddable ||
        !editorState.isLinkEmbeddable ||
        (editorState.isEmbedActive && !editorState.isRichCard) ||
        isEmbedFlagged,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { state } = editor;
        const { selection } = state;
        const LinkValue = editorState.linkUrl;
        if (LinkValue) {
          editor
            .chain()
            .insertExternalEmbed({
              [EExternalEmbedAttributeNames.IS_RICH_CARD]: false,
              [EExternalEmbedAttributeNames.SOURCE]: LinkValue,
              pos: selection,
            })
            .run();
        }
        setIsOpen(false);
      },
    },
    {
      icon: Bookmark,
      key: "richcard",
      label: "Convert to Rich Card",
      // label: "externalEmbedComponent.block_menu.convert_to_richcard",
      isDisabled: !editorState.isLinkEmbeddable || !editorState.linkUrl || editorState.isRichCard || isEmbedFlagged,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { state } = editor;
        const { selection } = state;
        const LinkValue = editorState.linkUrl;
        if (LinkValue) {
          editor
            .chain()
            .insertExternalEmbed({
              [EExternalEmbedAttributeNames.IS_RICH_CARD]: true,
              [EExternalEmbedAttributeNames.SOURCE]: LinkValue,
              pos: selection,
            })
            .run();
        }
        setIsOpen(false);
      },
    },
    {
      icon: Trash2,
      key: "delete",
      label: "Delete",
      onClick: (e) => {
        editor.chain().deleteSelection().focus().run();
        popup.current?.hide();
        e.preventDefault();
        e.stopPropagation();

        // Execute the delete action
        editor.chain().deleteSelection().focus().run();

        setIsOpen(false);
      },
    },
    {
      icon: Copy,
      key: "duplicate",
      label: "Duplicate",
      isDisabled:
        editor.state.selection.content().content.firstChild?.type.name === CORE_EXTENSIONS.IMAGE ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE) ||
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
        setIsOpen(false);
      },
    },
  ];

  if (!isOpen) {
    return null;
  }

  if (!isOpen) {
    return null;
  }
  return (
    <div
      ref={menuRef}
      className="z-10 max-h-60 min-w-[7rem] overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg"
    >
      {MENU_ITEMS.map((item) => {
        // Skip rendering the button if it should be disabled
        if (item.isDisabled && item.key === "duplicate") {
          return null;
        }

        return (
          <button
            key={item.key}
            type="button"
            className="flex w-full items-center gap-2 truncate rounded px-1 py-1.5 text-xs text-custom-text-200 hover:bg-custom-background-80"
            onClick={item.onClick}
            disabled={item.isDisabled}
          >
            <item.icon className="h-3 w-3" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
