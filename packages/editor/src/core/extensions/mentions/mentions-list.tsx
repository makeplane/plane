"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// ui
import { Avatar } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common";
// types
import { IMentionSuggestion } from "@/types";

interface MentionListProps {
  command: (item: {
    id: string;
    label: string;
    entity_name: string;
    entity_identifier: string;
    target: string;
    redirect_uri: string;
  }) => void;
  query: string;
  editor: Editor;
  mentionSuggestions: () => Promise<IMentionSuggestion[]>;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const { query, mentionSuggestions } = props;
  const [items, setItems] = useState<IMentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const suggestions = await mentionSuggestions();
        const mappedSuggestions: IMentionSuggestion[] = suggestions.map((suggestion): IMentionSuggestion => {
          const transactionId = uuidv4();
          return {
            ...suggestion,
            id: transactionId,
          };
        });

        const filteredSuggestions = mappedSuggestions.filter((suggestion) =>
          suggestion.title.toLowerCase().startsWith(query.toLowerCase())
        );

        setItems(filteredSuggestions);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [query, mentionSuggestions]);

  const selectItem = (index: number) => {
    try {
      const item = items[index];

      if (item) {
        props.command({
          id: item.id,
          label: item.title,
          entity_identifier: item.entity_identifier,
          entity_name: item.entity_name,
          target: "users",
          redirect_uri: item.redirect_uri,
        });
      }
    } catch (error) {
      console.error("Error selecting item:", error);
    }
  };

  const commandListContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;

    const item = container?.children[selectedIndex] as HTMLElement;

    if (item && container) updateScrollView(container, item);
  }, [selectedIndex]);

  const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
    const containerHeight = container.offsetHeight;
    const itemHeight = item ? item.offsetHeight : 0;

    const top = item.offsetTop;
    const bottom = top + itemHeight;

    if (top < container.scrollTop) {
      container.scrollTop -= container.scrollTop - top + 5;
    } else if (bottom > containerHeight + container.scrollTop) {
      container.scrollTop += bottom - containerHeight - container.scrollTop + 5;
    }
  };
  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div
      ref={commandListContainer}
      className="mentions max-h-48 min-w-[12rem] rounded-md bg-custom-background-100 border-[0.5px] border-custom-border-300 px-2 py-2.5 text-xs shadow-custom-shadow-rg overflow-y-scroll"
    >
      {isLoading ? (
        <div className="text-center text-custom-text-400">Loading...</div>
      ) : items.length ? (
        items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "w-full text-left flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-custom-background-80 text-custom-text-200",
              {
                "bg-custom-background-80": index === selectedIndex,
              }
            )}
            onClick={() => selectItem(index)}
          >
            <Avatar name={item?.title} src={item?.avatar} />
            <span className="flex-grow truncate">{item.title}</span>
          </button>
        ))
      ) : (
        <div className="text-center text-custom-text-400">No results</div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";
