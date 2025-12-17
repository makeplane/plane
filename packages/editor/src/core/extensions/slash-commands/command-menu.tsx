import { FloatingOverlay } from "@floating-ui/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { DROPDOWN_NAVIGATION_KEYS, getNextValidIndex } from "@/helpers/tippy";
// types
import type { ISlashCommandItem } from "@/types";
// components
import type { TSlashCommandSection } from "./command-items-list";
import { CommandMenuItem } from "./command-menu-item";

export type SlashCommandsMenuProps = SuggestionProps<TSlashCommandSection, ISlashCommandItem> & {
  onClose: () => void;
};

export const SlashCommandsMenu = forwardRef(function SlashCommandsMenu(props: SlashCommandsMenuProps, ref) {
  const { items: sections, command, query, onClose } = props;
  // states
  const [selectedIndex, setSelectedIndex] = useState({
    section: 0,
    item: 0,
  });
  // refs
  const commandListContainer = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (sectionIndex: number, itemIndex: number) => {
      const item = sections[sectionIndex]?.items?.[itemIndex];
      if (item) command(item);
    },
    [command, sections]
  );
  // handle arrow key navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (DROPDOWN_NAVIGATION_KEYS.includes(e.key)) {
        e.preventDefault();
        const currentSection = selectedIndex.section;
        const currentItem = selectedIndex.item;
        let nextSection = currentSection;
        let nextItem = currentItem;

        if (e.key === "ArrowUp") {
          nextItem = currentItem - 1;
          if (nextItem < 0) {
            nextSection = currentSection - 1;
            if (nextSection < 0) nextSection = sections.length - 1;
            nextItem = sections[nextSection]?.items?.length - 1;
          }
        }
        if (e.key === "ArrowDown") {
          nextItem = currentItem + 1;
          if (nextItem >= sections[currentSection]?.items?.length) {
            nextSection = currentSection + 1;
            if (nextSection >= sections.length) nextSection = 0;
            nextItem = 0;
          }
        }
        if (e.key === "Enter") {
          selectItem(currentSection, currentItem);
        }
        setSelectedIndex({
          section: nextSection,
          item: nextItem,
        });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sections, selectedIndex, setSelectedIndex, selectItem]);
  // initialize the select index to 0 by default
  useEffect(() => {
    setSelectedIndex({
      section: 0,
      item: 0,
    });
  }, [sections]);
  // scroll to the dropdown item when navigating via keyboard
  useLayoutEffect(() => {
    const container = commandListContainer?.current;
    if (!container) return;

    const item = container.querySelector(`#item-${selectedIndex.section}-${selectedIndex.item}`) as HTMLElement;

    // use scroll into view to bring the item in view if it is not in view
    item?.scrollIntoView({ block: "nearest" });
  }, [sections, selectedIndex]);

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

  useOutsideClickDetector(commandListContainer, onClose);

  const areSearchResultsEmpty = sections.map((s) => s.items?.length).reduce((acc, curr) => acc + curr, 0) === 0;

  if (areSearchResultsEmpty) return null;

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
        id="slash-command"
        ref={commandListContainer}
        className="relative max-h-80 min-w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200 space-y-2"
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
        {sections.map((section, sectionIndex) => (
          <div key={section.key} className="space-y-2">
            {section.title && <h6 className="text-11 font-semibold text-tertiary">{section.title}</h6>}
            <div>
              {section.items?.map((item, itemIndex) => (
                <CommandMenuItem
                  key={item.key}
                  isSelected={sectionIndex === selectedIndex.section && itemIndex === selectedIndex.item}
                  item={item}
                  itemIndex={itemIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectItem(sectionIndex, itemIndex);
                  }}
                  onMouseEnter={() =>
                    setSelectedIndex({
                      section: sectionIndex,
                      item: itemIndex,
                    })
                  }
                  sectionIndex={sectionIndex}
                  query={query}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

SlashCommandsMenu.displayName = "SlashCommandsMenu";
