import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
// helper
import { renderEmoji } from "helpers/emoji.helper";
// icons
import { Icon } from "components/ui";

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
              className={`flex justify-center items-center rounded-md px-2 ${
                size === "sm" ? "w-6 h-6" : size === "md" ? "w-7 h-7" : "w-8 h-8"
              }`}
            >
              <Icon iconName="add_reaction" className="text-custom-text-100 scale-125" />
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
              className={`bg-custom-sidebar-background-100 absolute -left-2 z-10 ${
                position === "top" ? "-top-12" : "-bottom-12"
              }`}
            >
              <div className="bg-custom-sidebar-background-100 border border-custom-border-200 shadow-custom-shadow-sm rounded-md p-1">
                <div className="flex gap-x-1">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSelect(emoji);
                        closePopover();
                      }}
                      className="flex select-none items-center justify-between rounded-md text-sm p-1 hover:bg-custom-sidebar-background-90"
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
