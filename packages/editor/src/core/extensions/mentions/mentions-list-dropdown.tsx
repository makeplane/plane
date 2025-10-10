"use client";

import { FloatingOverlay } from "@floating-ui/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
// plane utils
import { useOutsideClickDetector } from "@plane/hooks";
import { cn } from "@plane/utils";
// helpers
import { DROPDOWN_NAVIGATION_KEYS, getNextValidIndex } from "@/helpers/tippy";
// types
import { TMentionHandler, TMentionSection, TMentionSuggestion } from "@/types";

export type MentionsListDropdownProps = SuggestionProps<TMentionSection, TMentionSuggestion> &
  Pick<TMentionHandler, "searchCallback"> & {
    onClose: () => void;
  };

export const MentionsListDropdown = forwardRef((props: MentionsListDropdownProps, ref) => {
  const { command, query, searchCallback, onClose } = props;
  // states
  const [sections, setSections] = useState<TMentionSection[]>([]);
  const [selectedIndex, setSelectedIndex] = useState({
    section: 0,
    item: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  // refs
  const dropdownContainer = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (sectionIndex: number, itemIndex: number) => {
      try {
        const item = sections?.[sectionIndex]?.items?.[itemIndex];
        const transactionId = uuidv4();
        if (item) {
          command({
            ...item,
            id: transactionId,
          });
        }
      } catch (error) {
        console.error("Error selecting mention item:", error);
      }
    },
    [command, sections]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (!DROPDOWN_NAVIGATION_KEYS.includes(event.key)) return false;

      if (event.key === "Enter") {
        selectItem(selectedIndex.section, selectedIndex.item);
        return true;
      }

      const newIndex = getNextValidIndex({
        event,
        sections,
        selectedIndex,
      });
      if (newIndex) {
        setSelectedIndex(newIndex);
      }

      return true;
    },
  }));

  // initialize the select index to 0 by default
  useEffect(() => {
    setSelectedIndex({
      section: 0,
      item: 0,
    });
  }, [sections]);

  // fetch mention sections based on query
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const sectionsResponse = await searchCallback?.(query);
        if (sectionsResponse) {
          setSections(sectionsResponse);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [query, searchCallback]);

  // scroll to the dropdown item when navigating via keyboard
  useLayoutEffect(() => {
    const container = dropdownContainer?.current;
    if (!container) return;

    const item = container.querySelector(`#mention-item-${selectedIndex.section}-${selectedIndex.item}`) as HTMLElement;
    if (item) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      const isItemInView = itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

      if (!isItemInView) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  useOutsideClickDetector(dropdownContainer, onClose);

  return (
    <>
      {/* Backdrop */}
      <FloatingOverlay
        style={{
          zIndex: 99,
        }}
        lockScroll
      />
      <div
        ref={dropdownContainer}
        className="relative max-h-80 w-[14rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg space-y-2"
        style={{
          zIndex: 100,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {isLoading ? (
          <div className="text-center text-sm text-custom-text-400">Loading...</div>
        ) : sections.length ? (
          sections.map((section, sectionIndex) => (
            <div key={section.key} className="space-y-2">
              {section.title && <h6 className="text-xs font-semibold text-custom-text-300">{section.title}</h6>}
              {section.items.map((item, itemIndex) => {
                const isSelected = sectionIndex === selectedIndex.section && itemIndex === selectedIndex.item;

                return (
                  <button
                    key={item.id}
                    id={`mention-item-${sectionIndex}-${itemIndex}`}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 w-full rounded px-1 py-1.5 text-xs text-left truncate text-custom-text-200",
                      {
                        "bg-custom-background-80": isSelected,
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectItem(sectionIndex, itemIndex);
                    }}
                    onMouseEnter={() =>
                      setSelectedIndex({
                        section: sectionIndex,
                        item: itemIndex,
                      })
                    }
                  >
                    <span className="size-5 grid place-items-center flex-shrink-0">{item.icon}</span>
                    {item.subTitle && (
                      <h5 className="whitespace-nowrap text-xs text-custom-text-300 flex-shrink-0">{item.subTitle}</h5>
                    )}
                    <p className="flex-grow truncate">{item.title}</p>
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-custom-text-400">No results</div>
        )}
      </div>
    </>
  );
});

MentionsListDropdown.displayName = "MentionsListDropdown";
