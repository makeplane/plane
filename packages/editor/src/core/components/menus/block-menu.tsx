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
import { type Editor, useEditorState } from "@tiptap/react";
import { Copy, LucideIcon, Trash2, Link, Code, Bookmark } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
// plane imports
// import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EExternalEmbedAttributeNames, IEditorProps } from "@/types";

type Props = {
  editor: Editor;
  flaggedExtensions?: IEditorProps["flaggedExtensions"];
  disabledExtensions?: IEditorProps["disabledExtensions"];
};

export const BlockMenu = (props: Props) => {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const virtualReferenceRef = useRef<{ getBoundingClientRect: () => DOMRect }>({
    getBoundingClientRect: () => new DOMRect(),
  });
  // const { t } = useTranslation();
  const isEmbedFlagged =
    props.flaggedExtensions?.includes("external-embed") || props.disabledExtensions?.includes("external-embed");

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
        setIsOpen(true);
        return;
      }

      // If clicking outside and not on a menu item, hide the menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    },
    [refs]
  );

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      const selection = editor.state.selection;
      const content = selection.content().content;
      const firstChild = content.firstChild;
      let linkUrl: string | null = null;
      const foundLinkMarks: string[] = [];

      const isEmbedActive = editor.isActive(ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED);
      const isRichCard = firstChild?.attrs[EExternalEmbedAttributeNames.IS_RICH_CARD];
      const isNotEmbeddable = firstChild?.attrs[EExternalEmbedAttributeNames.HAS_EMBED_FAILED];

      if (firstChild) {
        for (let i = 0; i < firstChild.childCount; i++) {
          const node = firstChild.child(i);
          const linkMarks = node.marks?.filter(
            (mark) => mark.type.name === CORE_EXTENSIONS.CUSTOM_LINK && mark.attrs?.href
          );

          if (linkMarks && linkMarks.length > 0) {
            linkMarks.forEach((mark) => {
              foundLinkMarks.push(mark.attrs.href);
            });
          }
        }
        if (firstChild.attrs.src) {
          foundLinkMarks.push(firstChild.attrs.src);
        }
      }

      if (foundLinkMarks.length === 1) {
        linkUrl = foundLinkMarks[0];
      }

      return {
        isEmbedActive,
        isLinkEmbeddable: isEmbedActive || !!linkUrl,
        linkUrl,
        isRichCard,
        isNotEmbeddable,
      };
    },
  });

  // Set up event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
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
        setIsOpen(false);
        e.preventDefault();
        e.stopPropagation();
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
          const contentToInsert = firstChild.toJSON();
          if (contentToInsert.type === ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED) {
            return editor
              .chain()
              .insertExternalEmbed({
                [EExternalEmbedAttributeNames.IS_RICH_CARD]: contentToInsert.attrs.is_rich_card,
                [EExternalEmbedAttributeNames.SOURCE]: contentToInsert.attrs.src,
                pos: insertPos,
              })
              .focus(Math.min(insertPos + 1, docSize), { scrollIntoView: false })
              .run();
          } else if (contentToInsert.type === ADDITIONAL_EXTENSIONS.BLOCK_MATH) {
            return editor
              .chain()
              .setBlockMath({
                latex: contentToInsert.attrs.latex,
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
        }}
        className={cn(
          "z-20 max-h-60 min-w-[7rem] overflow-y-scroll rounded-lg border border-custom-border-200 bg-custom-background-100 p-1.5 shadow-custom-shadow-rg",
          "transition-all duration-300 transform origin-top-right",
          isAnimatedIn ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}
        {...getFloatingProps()}
      >
        {MENU_ITEMS.map((item) => {
          if (item.isDisabled) {
            return null;
          }
          return (
            <button
              key={item.key}
              type="button"
              className="flex w-full items-center gap-1.5 truncate rounded px-1 py-1.5 text-xs text-custom-text-200 hover:bg-custom-background-90"
              onClick={item.onClick}
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
};
