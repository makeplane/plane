import { Editor } from "@tiptap/react";
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { IMentionSuggestion } from "src/types/mention-suggestion";
import { v4 as uuidv4 } from "uuid";

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
  const [isLoading, setIsLoading] = useState(false); // New loading state

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true); // Start loading
      const suggestions = await mentionSuggestions();
      const mappedSuggestions: IMentionSuggestion[] = suggestions.map((suggestion): IMentionSuggestion => {
        const transactionId = uuidv4();
        return {
          ...suggestion,
          id: transactionId,
        };
      });

      const filteredSuggestions = mappedSuggestions
        .filter((suggestion) => suggestion.title.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5);

      setItems(filteredSuggestions);
      setIsLoading(false); // End loading
    };

    fetchSuggestions();
  }, [query, mentionSuggestions]);

  const selectItem = (index: number) => {
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
      className="mentions absolute max-h-40 w-48 space-y-0.5 overflow-y-auto rounded-md bg-custom-background-100 p-1 text-sm text-custom-text-300 shadow-custom-shadow-sm"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-full text-gray-500">Loading...</div>
      ) : items.length ? (
        items.map((item, index) => (
          <div
            key={item.id}
            className={`flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-custom-background-80 ${
              index === selectedIndex ? "bg-custom-background-80" : ""
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="grid h-4 w-4 flex-shrink-0 place-items-center overflow-hidden">
              {item.avatar && item.avatar.trim() !== "" ? (
                <img src={item.avatar} className="h-full w-full rounded-sm object-cover" alt={item.title} />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-sm bg-gray-700 text-xs capitalize text-white">
                  {item.title[0]}
                </div>
              )}
            </div>
            <div className="flex-grow space-y-1 truncate">
              <p className="truncate text-sm font-medium">{item.title}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="flex justify-center items-center h-full">No results</div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";
