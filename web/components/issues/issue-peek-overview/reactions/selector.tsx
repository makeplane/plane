import { FC, Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
// helper
import { renderEmoji } from "helpers/emoji.helper";
// icons
import { SmilePlus } from "lucide-react";
// constants
import { issueReactionEmojis } from "constants/issue";

interface IIssueReactionSelector {
  size?: "sm" | "md" | "lg";
  position?: "top" | "bottom";
  onSelect: (reaction: any) => void;
}

export const IssueReactionSelector: FC<IIssueReactionSelector> = (props) => {
  const { size = "md", position = "top", onSelect } = props;

  return (
    <>
      <Popover className="relative">
        {({ open, close: closePopover }) => (
          <>
            <Popover.Button
              className={`${
                open ? "" : "bg-custom-background-90"
              } group inline-flex items-center rounded-md bg-custom-background-90 focus:outline-none transition-all hover:bg-custom-background-100`}
            >
              <span
                className={`flex justify-center items-center rounded-md px-2 ${
                  size === "sm" ? "w-6 h-6" : size === "md" ? "w-7 h-7" : "w-8 h-8"
                }`}
              >
                <SmilePlus className="text-custom-text-100 h-3.5 w-3.5" />
              </span>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel
                className={`bg-custom-sidebar-background-100 border border-custom-border-200 shadow-custom-shadow-sm rounded p-1 overflow-hidden absolute -left-2 z-10 ${
                  position === "top" ? "-top-10" : "-bottom-10"
                }`}
              >
                <div className="flex gap-x-1">
                  {issueReactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        if (onSelect) onSelect(emoji);
                        closePopover();
                      }}
                      className="select-none rounded text-sm p-1 hover:bg-custom-sidebar-background-80 transition-all w-6 h-6 flex justify-center items-center"
                    >
                      <div className="w-4 h-4">{renderEmoji(emoji)}</div>
                    </button>
                  ))}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
};
