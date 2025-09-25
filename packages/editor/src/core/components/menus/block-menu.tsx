import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/react";
import { Copy, LucideIcon, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
// constants
import { cn } from "@plane/utils";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { IEditorProps } from "@/types";

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

        // Ensure the targeted block is selected
        const rect = dragHandle.getBoundingClientRect();
        const coords = { left: rect.left + rect.width / 2, top: rect.top + rect.height / 2 };
        const posAtCoords = editor.view.posAtCoords(coords);
        if (posAtCoords) {
          const $pos = editor.state.doc.resolve(posAtCoords.pos);
          const nodePos = $pos.before($pos.depth);
          editor.chain().setNodeSelection(nodePos).run();
        }
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
      icon: Trash2,
      key: "delete",
      label: "Delete",
      onClick: (e) => {
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
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE),
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
          zIndex: 99,
          animationFillMode: "forwards",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", // Expo ease out
        }}
        className={cn(
          "z-20 max-h-60 min-w-[7rem] overflow-y-scroll rounded-lg border border-custom-border-200 bg-custom-background-100 p-1.5 shadow-custom-shadow-rg",
          "transition-all duration-300 transform origin-top-right",
          isAnimatedIn ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}
        data-prevent-outside-click
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
            </button>
          );
        })}
      </div>
    </FloatingPortal>
  );
};
