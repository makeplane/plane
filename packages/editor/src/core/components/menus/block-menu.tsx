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
import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CopyIcon, TrashIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { IEditorProps } from "@/types";
// components
import { getNodeOptions } from "./block-menu-options";

type Props = {
  disabledExtensions?: IEditorProps["disabledExtensions"];
  editor: Editor;
  flaggedExtensions?: IEditorProps["flaggedExtensions"];
  workItemIdentifier?: IEditorProps["workItemIdentifier"];
};
export type BlockMenuOption = {
  icon: LucideIcon | React.FC<ISvgIcons>;
  key: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  isDisabled?: boolean;
};

export function BlockMenu(props: Props) {
  const { editor, workItemIdentifier } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const virtualReferenceRef = useRef<{ getBoundingClientRect: () => DOMRect }>({
    getBoundingClientRect: () => new DOMRect(),
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
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE),
      onClick: (_e) => {
        try {
          const { state } = editor;
          const { selection } = state;
          const firstChild = selection.content().content.firstChild;
          const docSize = state.doc.content.size;

          if (!firstChild) {
            throw new Error("No content selected or content is not duplicable.");
          }

          // Directly use selection.to as the insertion position
          const insertPos = selection.to;

          // Ensure the insertion position is within the document's bounds
          if (insertPos < 0 || insertPos > docSize) {
            throw new Error("The insertion position is invalid or outside the document.");
          }

          const contentToInsert = firstChild.toJSON();

          // Insert the content at the calculated position
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
        {MENU_ITEMS.map((item) => {
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
            </button>
          );
        })}
      </div>
    </FloatingPortal>
  );
}
