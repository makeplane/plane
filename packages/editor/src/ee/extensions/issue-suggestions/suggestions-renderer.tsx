import { Editor } from "@tiptap/core";
import { ReactRenderer, Range } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import tippy from "tippy.js";
import { v4 as uuidv4 } from "uuid";
// helpers
import { cn } from "@plane/utils";
// types
import { TEmbedItem } from "@/types";

type TSuggestionsListProps = {
  editor: Editor;
  searchCallback: (searchQuery: string) => Promise<TEmbedItem[]>;
  query: string;
  range: Range;
};

const IssueSuggestionList = (props: TSuggestionsListProps) => {
  const { editor, searchCallback, query, range } = props;
  // states
  const [items, setItems] = useState<TEmbedItem[] | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (item: TEmbedItem) => {
      try {
        const docSize = editor.state.doc.content.size;
        if (range.from < 0 || range.to >= docSize) return;

        const transactionId = uuidv4();
        editor
          .chain()
          .deleteRange(range)
          .insertContentAt(range.from, {
            type: "issue-embed-component",
            attrs: {
              entity_identifier: item?.id,
              project_identifier: item?.projectId,
              workspace_identifier: item?.workspaceSlug,
              id: transactionId,
              entity_name: "issue",
            },
          })
          .run();

        // new document state and calculate the new position
        const newDoc = editor.state.doc;
        const newPositionToInsertEmptyParaAt = range.from + (newDoc?.nodeAt(range.from)?.nodeSize ?? 0);

        // insert an empty paragraph at the position after the issue embed
        editor
          .chain()
          .insertContentAt(newPositionToInsertEmptyParaAt, { type: "paragraph" })
          .setTextSelection(newPositionToInsertEmptyParaAt + 1)
          .run();
      } catch (error) {
        console.log("Error inserting issue embed", error);
      }
    },
    [editor, range]
  );

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter", "Tab"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (!items) return;

      if (navigationKeys.includes(e.key)) {
        if (e.key === "ArrowUp") {
          const newIndex = selectedIndex - 1;
          setSelectedIndex(newIndex < 0 ? items.length - 1 : newIndex);
          return true;
        }
        if (e.key === "ArrowDown") {
          const newIndex = selectedIndex + 1;
          setSelectedIndex(newIndex >= items.length ? 0 : newIndex);
          return true;
        }
        if (e.key === "Enter") {
          const item = items[selectedIndex];
          selectItem(item);
          return true;
        }
        return false;
      } else if (e.key === "Escape") {
        if (!editor.isFocused) editor.chain().focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [editor, items, selectedIndex, setSelectedIndex, selectItem]);

  useEffect(() => {
    setItems(undefined);
    searchCallback(query).then((data) => {
      setItems(data);
    });
  }, [query, searchCallback]);

  return (
    <div
      id="issue-list-container"
      className="z-10 overflow-y-auto overflow-x-hidden rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 max-h-60 w-96 px-2 py-2.5 shadow-custom-shadow-rg whitespace-nowrap transition-all"
    >
      {items ? (
        items.length > 0 ? (
          items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 select-none truncate rounded px-1 py-1.5 text-left text-xs text-custom-text-200 hover:bg-custom-background-90",
                {
                  "bg-custom-background-90": index === selectedIndex,
                }
              )}
              onClick={() => selectItem(item)}
            >
              <h5 className="whitespace-nowrap text-xs text-custom-text-300 flex-shrink-0">{item.subTitle}</h5>
              {item.icon}
              <p className="flex-grow w-full truncate text-xs">{item.title}</p>
            </button>
          ))
        ) : (
          <div className="text-center text-xs text-custom-text-400">No results found</div>
        )
      ) : (
        <div className="text-center text-xs text-custom-text-400">Loading</div>
      )}
    </div>
  );
};

export const IssueListRenderer = (searchCallback: (searchQuery: string) => Promise<TEmbedItem[]>) => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      const tippyContainer =
        document.querySelector(".active-editor") ?? document.querySelector('[id^="editor-container"]');

      component = new ReactRenderer(IssueSuggestionList, {
        props: {
          ...props,
          searchCallback,
        },
        editor: props.editor,
      });
      // @ts-expect-error Tippy overloads are messed up
      popup = tippy("body", {
        flipbehavior: ["bottom", "top"],
        appendTo: tippyContainer,
        flip: true,
        flipOnUpdate: true,
        getReferenceClientRect: props.clientRect,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });

      tippyContainer?.addEventListener("scroll", () => {
        popup?.[0].destroy();
      });
    },
    onUpdate: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component?.updateProps(props);
      popup?.[0]?.setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();
        return true;
      }

      const navigationKeys = ["ArrowUp", "ArrowDown", "Enter", "Tab"];
      if (navigationKeys.includes(props.event.key)) {
        // @ts-expect-error fix the types
        component?.ref?.onKeyDown(props);
        return true;
      }
      return false;
    },
    onExit: () => {
      const container = document.querySelector(".frame-renderer") as HTMLElement;
      if (container) {
        container.removeEventListener("scroll", () => {});
      }
      popup?.[0].destroy();
      setTimeout(() => {
        component?.destroy();
      }, 300);
    },
  };
};
