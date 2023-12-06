import { cn } from "@plane/editor-core";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";
import { ReactRenderer } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
    let newDisplayedItems: { [key: string]: IssueSuggestionProps[] } = {};
    let totalLength = 0;
    sections.forEach((section) => {
      newDisplayedItems[section] = items
        .filter((item) => item.state === section)
        .slice(0, 5);

      totalLength += newDisplayedItems[section].length;
    });
    setDisplayedTotalLength(totalLength);
    setDisplayedItems(newDisplayedItems);
  }, [items]);

  const selectItem = useCallback(
    (index: number) => {
      const item = displayedItems[currentSection][index];
      if (item) {
        command(item);
      }
    },
    [command, displayedItems, currentSection],
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
            (selectedIndex + displayedItems[currentSection].length - 1) %
              displayedItems[currentSection].length,
          );
          return true;
        }
        if (e.key === "ArrowDown") {
          const nextIndex =
            (selectedIndex + 1) % displayedItems[currentSection].length;
          setSelectedIndex(nextIndex);
          if (nextIndex === 4) {
            const nextItems = items
              .filter((item) => item.state === currentSection)
              .slice(
                displayedItems[currentSection].length,
                displayedItems[currentSection].length + 5,
              );
            setDisplayedItems((prevItems) => ({
              ...prevItems,
              [currentSection]: [...prevItems[currentSection], ...nextItems],
            }));
          }
          return true;
        }
        if (e.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        if (e.key === "Tab") {
          const currentSectionIndex = sections.indexOf(currentSection);
          const nextSectionIndex = (currentSectionIndex + 1) % sections.length;
          setCurrentSection(sections[nextSectionIndex]);
          setSelectedIndex(0);
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
  }, [
    displayedItems,
    selectedIndex,
    setSelectedIndex,
    selectItem,
    currentSection,
  ]);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;
    if (container) {
      const sectionContainer = container?.querySelector(
        `#${currentSection}-container`,
      ) as HTMLDivElement;
      if (sectionContainer) {
        updateScrollView(container, sectionContainer);
      }
      const sectionScrollContainer = container?.querySelector(
        `#${currentSection}`,
      ) as HTMLElement;
      const item = sectionScrollContainer?.children[
        selectedIndex
      ] as HTMLElement;
      if (item && sectionScrollContainer) {
        updateScrollView(sectionScrollContainer, item);
      }
    }
  }, [selectedIndex, currentSection]);

  return displayedTotalLength > 0 ? (
    <div
      id="issue-list-container"
      ref={commandListContainer}
      className="z-[10] fixed max-h-80 w-60 overflow-y-auto overflow-x-hidden rounded-md border border-custom-border-100 bg-custom-background-100 px-1 shadow-custom-shadow-xs transition-all"
    >
      {sections.map((section) => {
        const sectionItems = displayedItems[section];

        return (
          sectionItems &&
          sectionItems.length > 0 && (
            <div
              className="h-full w-full flex flex-col"
              key={`${section}-container`}
              id={`${section}-container`}
            >
              <h6 className="sticky top-0 z-[10] bg-custom-background-100 text-xs text-custom-text-400 font-medium px-2 py-1">
                {section}
              </h6>
              <div className="h-full w-full truncate space-y-0.5" id={section}>
                {sectionItems.map((item, index) => (
                  <button
                    type="button"
                    className={cn(
                      `w-full flex items-center gap-2 rounded px-2 py-1 text-left text-custom-text-200 hover:bg-custom-primary-100/5 hover:text-custom-text-100 truncate`,
                      {
                        "bg-custom-primary-100/5  text-custom-text-100":
                          section === currentSection && index === selectedIndex,
                      },
                    )}
                    key={index}
                    onClick={() => selectItem(index)}
                  >
                    <p className="text-xs text-custom-text-300 whitespace-nowrap">
                      {item.identifier}
                    </p>
                    <span className="flex-shrink-0">
                      <PriorityIcon
                        priority={item.priority}
                        className="h-3.5 w-3.5"
                      />
                    </span>
                    <h5 className="flex-grow text-xs truncate">{item.title}</h5>
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
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
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
        placement: "right",
      });
    },
    onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
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
