import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
// components
import { TSlashCommandSection } from "./command-items-list";
import { CommandMenuItem } from "./command-menu-item";

export type SlashCommandsMenuProps = {
  items: TSlashCommandSection[];
  command: any;
};

export const SlashCommandsMenu = (props: SlashCommandsMenuProps) => {
  const { items: sections, command } = props;
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
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
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
            nextItem = sections[nextSection]?.items.length - 1;
          }
        }
        if (e.key === "ArrowDown") {
          nextItem = currentItem + 1;
          if (nextItem >= sections[currentSection].items.length) {
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

  const areSearchResultsEmpty = sections.map((s) => s.items.length).reduce((acc, curr) => acc + curr, 0) === 0;

  if (areSearchResultsEmpty) return null;

  return (
    <div
      id="slash-command"
      ref={commandListContainer}
      className="z-10 max-h-80 min-w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg space-y-2"
    >
      {sections.map((section, sectionIndex) => (
        <div key={section.key} className="space-y-2">
          {section.title && <h6 className="text-xs font-semibold text-custom-text-300">{section.title}</h6>}
          <div>
            {section.items.map((item, itemIndex) => (
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
