import { Fragment } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// helper
import { renderEmoji } from "@/helpers/emoji.helper";
// icons

const reactionEmojis = ["128077", "128078", "128516", "128165", "128533", "129505", "9992", "128064"];

interface Props {
  size?: "sm" | "md" | "lg";
  position?: "top" | "bottom";
  value?: string | string[] | null;
  onSelect: (emoji: string) => void;
}

export const ReactionSelector: React.FC<Props> = (props) => {
  const { onSelect, position, size } = props;

  return (
    <Popover className="relative">
      {({ open, close: closePopover }) => (
        <>
          <Popover.Button
            className={`${
              open ? "" : "text-opacity-90"
            } group inline-flex items-center rounded-md bg-custom-background-80 focus:outline-none`}
          >
            <span
              className={`flex items-center justify-center rounded-md px-2 ${
                size === "sm" ? "h-6 w-6" : size === "md" ? "h-7 w-7" : "h-8 w-8"
              }`}
            >
              <SmilePlus className="h-3.5 w-3.5 text-custom-text-100" />
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
              className={`absolute z-10 bg-custom-sidebar-background-100 ${
                position === "top" ? "-top-12" : "-bottom-12"
              }`}
            >
              <div className="rounded-md border border-custom-border-200 bg-custom-sidebar-background-100 p-1">
                <div className="flex gap-x-1">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSelect(emoji);
                        closePopover();
                      }}
                      className="flex select-none items-center justify-between rounded-md p-1 text-sm hover:bg-custom-sidebar-background-90"
                    >
                      {renderEmoji(emoji)}
                    </button>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
