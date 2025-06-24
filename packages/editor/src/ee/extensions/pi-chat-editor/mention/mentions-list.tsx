import { Disclosure, Transition } from "@headlessui/react";
import { Editor } from "@tiptap/core";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { IMentionSuggestion } from "./extension";

interface IItem {
  id: string;
  label: string;
  entity_name: string;
  entity_identifier: string;
  target: string;
  redirect_uri: string;
  name?: string;
  project__identifier?: string;
  sequence_id?: string;
  title?: string;
  subTitle?: string;
  icon?: JSX.Element;
}
interface MentionListProps {
  command: (item: IItem) => void;
  items: IItem;
  query: string;
  editor: Editor;
  mentionSuggestions: () => Promise<IMentionSuggestion[]>;
}
const suggestionTypes = ["issue", "page", "cycle", "module"];

type TSuggestion = {
  type: string;
  data: IItem[];
  key: number;
  selectedIndex: number;
  isSectionSelected: boolean;
  onClick: (item: IItem, type: string) => void;
};

const Suggestions = ({ type, data, onClick, key, selectedIndex, isSectionSelected }: TSuggestion) => (
  <>
    <Disclosure as="div" className="flex flex-col py-2 ">
      <div className="flex">
        <div
          className={cn(
            "group w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400"
          )}
        >
          <>
            <span className="text-xs font-medium capitalize text-custom-text-300 my-1">{type}</span>
          </>
        </div>
      </div>
      <Transition
        show
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Disclosure.Panel as="div" className={cn("text-xs space-y-0 ml-0")} static>
          {data &&
            data.map((d: IItem, index) => (
              <div
                id={`${key}-${index}`}
                key={index}
                onClick={() => onClick(d, type)}
                className={cn(
                  "gap-1 rounded p-1 my-1 cursor-pointer hover:bg-custom-sidebar-background-80/50 text-xs font-medium text-custom-text-200 space-x-1 flex",
                  {
                    "bg-custom-sidebar-background-80/50": selectedIndex === index && isSectionSelected,
                  }
                )}
              >
                <span className="my-auto"> {d.icon}</span>
                <span className="truncate h-[16px]">{d.title}</span>
              </div>
            ))}
          {data && data.length === 0 && <div className="text-xs text-custom-text-400">No results found</div>}
        </Disclosure.Panel>
      </Transition>
    </Disclosure>
  </>
);

export const PiChatEditorMentionsList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSection, setSelectedSection] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);

  const selectItem = (selectedItem: IItem, type: string) => {
    try {
      if (selectedItem) {
        props.command({
          id: selectedItem.id,
          label: type === "issue" ? `${selectedItem.subTitle ?? ""}` : (selectedItem.title ?? ""),
          entity_identifier: selectedItem.id,
          entity_name: selectedItem.title ?? "",
          target: `${type}s`,
          redirect_uri: "",
        });
      }
    } catch (error) {
      console.error("Error selecting item:", error);
    }
  };
  const handleNextSection = () => {
    let nextSection = (selectedSection + 1) % suggestionTypes.length;
    while (props.items[suggestionTypes[nextSection]].length === 0) {
      nextSection = (nextSection + 1) % suggestionTypes.length;
    }
    setSelectedSection(nextSection);
  };

  const upHandler = () => {
    if (selectedIndex === 0) {
      setSelectedIndex(props.items[suggestionTypes[selectedSection]].length - 1);
      let prevSection = (selectedSection - 1 + suggestionTypes.length) % suggestionTypes.length;
      while (props.items[suggestionTypes[prevSection]].length === 0) {
        prevSection = (prevSection - 1 + suggestionTypes.length) % suggestionTypes.length;
      }
      setSelectedSection(prevSection);
    } else setSelectedIndex(selectedIndex - 1);
  };

  const downHandler = () => {
    if (selectedIndex === props.items[suggestionTypes[selectedSection]].length - 1) {
      setSelectedIndex(0);
      handleNextSection();
    } else setSelectedIndex(selectedIndex + 1);
  };

  const enterHandler = () => {
    selectItem(props.items[suggestionTypes[selectedSection]][selectedIndex], suggestionTypes[selectedSection]);
  };

  const tabHandler = () => {
    handleNextSection();
    setSelectedIndex(0);
  };

  useEffect(() => {
    setSelectedIndex(0);
    setSelectedSection(0);
    setIsEmpty(true);
    for (const key in props.items) {
      if (props.items[key].length > 0) {
        setIsEmpty(false);
        return;
      }
    }
  }, [props.items]);

  // Function to handle keydown events

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (isEmpty) return false;

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
      if (event.key === "Tab") {
        tabHandler();
        return true;
      }

      return false;
    },
  }));

  const scrollIntoViewHelper = async (elementId: string) => {
    const sourceElementId = elementId ?? "";
    const sourceElement = document.getElementById(sourceElementId);
    if (sourceElement)
      await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
  };

  useEffect(() => {
    scrollIntoViewHelper(`${selectedSection}-${selectedIndex}`);
  }, [selectedSection, selectedIndex]);
  return (
    <div className="w-[270px] border border-custom-border-100 rounded p-2 divide-y-[1px] divide-custom-border-100 bg-custom-background-100 max-h-full overflow-y-scroll">
      {suggestionTypes.map((type, index) => (
        <Suggestions
          key={index}
          type={type}
          data={props.items[type]}
          onClick={selectItem}
          selectedIndex={selectedIndex}
          isSectionSelected={selectedSection === index}
        />
      ))}
    </div>
  );
});
