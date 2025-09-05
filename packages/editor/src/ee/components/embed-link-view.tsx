import { Editor } from "@tiptap/react";
import { Link, Code, Bookmark } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { EExternalEmbedAttributeNames } from "@/types";
import { insertExternalEmbed } from "../helpers/editor-commands";

export type EmbedLinkViewProps = {
  editor: Editor;
  posToInsert: { from: number; to: number };
  url: string;
  text?: string;
  closeLinkView: () => void;
};

export const EmbedLinkView = (props: EmbedLinkViewProps) => {
  const { editor, posToInsert, url, closeLinkView } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleEmbed = () => {
    insertExternalEmbed({ editor, range: posToInsert, [EExternalEmbedAttributeNames.IS_RICH_CARD]: false, src: url });
    editor.commands.createParagraphNear();
    closeLinkView();
  };

  const handleBookmark = () => {
    insertExternalEmbed({ editor, range: posToInsert, [EExternalEmbedAttributeNames.IS_RICH_CARD]: true, src: url });
    editor.commands.createParagraphNear();
    closeLinkView();
  };

  const handleUrl = () => {
    closeLinkView();
    editor.commands.focus();
  };

  const menuItems = useMemo(
    () => [
      {
        key: "url",
        title: "URL",
        icon: Link,
        action: handleUrl,
      },
      {
        key: "embed",
        title: "Embed",
        icon: Code,
        action: handleEmbed,
      },
      {
        key: "richcard",
        title: "Rich Card",
        icon: Bookmark,
        action: handleBookmark,
      },
    ],
    [closeLinkView, handleEmbed, handleBookmark]
  );

  // Handle keyboard navigation and auto-focus
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Auto-focus the modal to capture keyboard events
    modalElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle events if they're coming from our modal or its children
      if (!modalElement.contains(e.target as Node)) return;

      if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Extra protection

        if (e.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
        } else if (e.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === "Enter") {
          // Execute the selected action
          menuItems[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeLinkView();
      }
    };

    // Add event listener to the modal element with capture phase
    modalElement.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      modalElement.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [menuItems, selectedIndex, closeLinkView]);

  return (
    <div
      ref={modalRef}
      className="my-1 min-w-32 overflow-hidden rounded-md border-[0.5px]  max-w-[12rem] border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg animate-in fade-in slide-in-from-bottom-2 focus:outline-none"
      tabIndex={-1}
      role="menu"
      aria-label="Paste options"
      onKeyDown={(e) => {
        // Additional layer of protection - prevent any keyboard events from bubbling up
        if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
          e.stopPropagation();
        }
      }}
    >
      <div className="px-4 pt-2 text-xs font-medium text-custom-text-300">Paste as</div>
      <div className="p-2 space-y-0">
        {menuItems.map((item, index) => (
          <div
            key={item.key}
            className={`w-full rounded px-2 py-1.5 ${selectedIndex === index ? "bg-custom-background-80" : ""}`}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className="w-full flex items-center gap-2 text-left text-xs text-custom-text-200"
            >
              <item.icon className="size-3.5 text-custom-text-500" />
              {item.title}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
