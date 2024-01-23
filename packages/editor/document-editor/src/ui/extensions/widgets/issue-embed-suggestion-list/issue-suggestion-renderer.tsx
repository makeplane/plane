import { cn } from "@plane/editor-core";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";
import { ReactRenderer } from "@tiptap/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PriorityIcon } from "@plane/ui";

const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight;
  const itemHeight = item ? item.offsetHeight : 0;

  const top = item.offsetTop;
  const bottom = top + itemHeight;

  if (top < container.scrollTop) {
    // container.scrollTop = top - containerHeight;
    item.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  } else if (bottom > containerHeight + container.scrollTop) {
    // container.scrollTop = bottom - containerHeight;
    item.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};
interface IssueSuggestionProps {
  title: string;
  priority: "high" | "low" | "medium" | "urgent" | "none";
  state: "Cancelled" | "In Progress" | "Todo" | "Done" | "Backlog";
  identifier: string;
}

const IssueSuggestionList = ({
  items,
  command,
  editor,
}: {
  items: IssueSuggestionProps[];
  command: any;
  editor: Editor;
  range: any;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<string>("Backlog");
  const sections = ["Backlog", "In Progress", "Todo", "Done", "Cancelled"];
  const [displayedItems, setDisplayedItems] = useState<{
    [key: string]: IssueSuggestionProps[];
  }>({});
  const [displayedTotalLength, setDisplayedTotalLength] = useState(0);
  const commandListContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newDisplayedItems: { [key: string]: IssueSuggestionProps[] } = {};
    let totalLength = 0;
    sections.forEach((section) => {
      newDisplayedItems[section] = items.filter((item) => item.state === section).slice(0, 5);

      totalLength += newDisplayedItems[section].length;
    });
    setDisplayedTotalLength(totalLength);
    setDisplayedItems(newDisplayedItems);
  }, [items]);

  const selectItem = useCallback(
    (section: string, index: number) => {
      const item = displayedItems[section][index];
      if (item) {
        command(item);
      }
    },
    [command, displayedItems, currentSection]
  );

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter", "Tab"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        // if (editor.isFocused) {
        //   editor.chain().blur();
        //   commandListContainer.current?.focus();
        // }
        if (e.key === "ArrowUp") {
          setSelectedIndex(
            (selectedIndex + displayedItems[currentSection].length - 1) % displayedItems[currentSection].length
          );
          e.stopPropagation();
          return true;
        }
        if (e.key === "ArrowDown") {
          const nextIndex = (selectedIndex + 1) % displayedItems[currentSection].length;
          setSelectedIndex(nextIndex);
          if (nextIndex === 4) {
            const nextItems = items
              .filter((item) => item.state === currentSection)
              .slice(displayedItems[currentSection].length, displayedItems[currentSection].length + 5);
            setDisplayedItems((prevItems) => ({
              ...prevItems,
              [currentSection]: [...prevItems[currentSection], ...nextItems],
            }));
          }
          e.stopPropagation();
          return true;
        }
        if (e.key === "Enter") {
          selectItem(currentSection, selectedIndex);
          e.stopPropagation();
          return true;
        }
        if (e.key === "Tab") {
          const currentSectionIndex = sections.indexOf(currentSection);
          const nextSectionIndex = (currentSectionIndex + 1) % sections.length;
          setCurrentSection(sections[nextSectionIndex]);
          setSelectedIndex(0);
          e.stopPropagation();
          return true;
        }
        return false;
      } else if (e.key === "Escape") {
        if (!editor.isFocused) {
          editor.chain().focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [displayedItems, selectedIndex, setSelectedIndex, selectItem, currentSection]);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;
    if (container) {
      const sectionContainer = container?.querySelector(`#${currentSection}-container`) as HTMLDivElement;
      if (sectionContainer) {
        updateScrollView(container, sectionContainer);
      }
      const sectionScrollContainer = container?.querySelector(`#${currentSection}`) as HTMLElement;
      const item = sectionScrollContainer?.children[selectedIndex] as HTMLElement;
      if (item && sectionScrollContainer) {
        updateScrollView(sectionScrollContainer, item);
      }
    }
  }, [selectedIndex, currentSection]);

  return displayedTotalLength > 0 ? (
    <div
      id="issue-list-container"
      ref={commandListContainer}
      className="fixed z-[10] max-h-80 w-60 overflow-y-auto overflow-x-hidden rounded-md border border-custom-border-100 bg-custom-background-100 px-1 shadow-custom-shadow-xs transition-all"
    >
      {sections.map((section) => {
        const sectionItems = displayedItems[section];
        return (
          sectionItems &&
          sectionItems.length > 0 && (
            <div className={"flex h-full w-full flex-col"} key={`${section}-container`} id={`${section}-container`}>
              <h6
                className={
                  "sticky top-0 z-[10] bg-custom-background-100 px-2 py-1 text-xs font-medium text-custom-text-400"
                }
              >
                {section}
              </h6>
              <div key={section} id={section} className={"max-h-[140px] overflow-x-hidden overflow-y-scroll"}>
                {sectionItems.map((item: IssueSuggestionProps, index: number) => (
                  <button
                    className={cn(
                      `flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-custom-text-200 hover:bg-custom-primary-100/5 hover:text-custom-text-100`,
                      {
                        "bg-custom-primary-100/5  text-custom-text-100":
                          section === currentSection && index === selectedIndex,
                      }
                    )}
                    key={item.identifier}
                    onClick={() => selectItem(section, index)}
                  >
                    <h5 className="whitespace-nowrap text-xs text-custom-text-300">{item.identifier}</h5>
                    <PriorityIcon priority={item.priority} />
                    <div>
                      <p className="flex-grow truncate text-xs">{item.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        );
      })}
    </div>
  ) : null;
};

export const IssueListRenderer = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component = new ReactRenderer(IssueSuggestionList, {
        props,
        // @ts-ignore
        editor: props.editor,
      });

      // @ts-ignore
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.querySelector("#editor-container"),
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component?.updateProps(props);

      popup &&
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();
        return true;
      }
      // @ts-ignore
      return component?.ref?.onKeyDown(props);
    },
    onExit: (e) => {
      popup?.[0].destroy();
      setTimeout(() => {
        component?.destroy();
      }, 300);
    },
  };
};
