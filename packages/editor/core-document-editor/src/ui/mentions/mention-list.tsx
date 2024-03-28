import { Editor } from "@tiptap/react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { IMentionSuggestion } from "src/types/mention-suggestion";

interface MentionListProps {
  items: IMentionSuggestion[];
  command: (item: { id: string; label: string; target: string; redirect_uri: string }) => void;
  editor: Editor;
}

// eslint-disable-next-line react/display-name
export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({
        id: item.id,
        label: item.title,
        target: "users",
        redirect_uri: item.redirect_uri,
      });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

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

  return props.items && props.items.length !== 0 ? (
    <div className="mentions absolute max-h-40 w-48 space-y-0.5 overflow-y-auto rounded-md bg-custom-background-100 p-1 text-sm text-custom-text-300 shadow-custom-shadow-sm">
      {props.items.length ? (
        props.items.map((item, index) => (
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
              {/* <p className="text-xs text-gray-400">{item.subtitle}</p> */}
            </div>
          </div>
        ))
      ) : (
        <div className="item">No result</div>
      )}
    </div>
  ) : (
    <></>
  );
});

MentionList.displayName = "MentionList";
