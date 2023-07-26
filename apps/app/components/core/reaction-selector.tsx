import { Fragment } from "react";

import { Popover, Transition } from "@headlessui/react";

import { renderEmoji } from "helpers/emoji.helper";

import { Icon } from "components/ui";

const emojis = ["128077", "128078", "128516", "128165", "128533", "129505", "9992", "128064"];

interface CommonProps {
  position?: "top" | "bottom";
  size?: "sm" | "md" | "lg";
}

interface SingleEmojiProps extends CommonProps {
  multiple?: false;
  value?: string | null;
  onSelect: (emoji: string) => void;
}

interface MultipleEmojiProps extends CommonProps {
  multiple: true;
  value?: string[] | null;
  onSelect: (emoji: string[]) => void;
}

type Props = SingleEmojiProps | MultipleEmojiProps;

export const ReactionSelector: React.FC<Props> = (props) => {
  const { value, onSelect, multiple, position, size } = props;

  return (
    <Popover className="relative">
      {({ open, close: closePopover }) => (
        <>
          <Popover.Button
            className={`${
              open ? "" : "text-opacity-90"
            } group inline-flex items-center rounded-md px-3 py-2 focus:outline-none`}
          >
            <span
              className={`flex justify-center items-center rounded-full border ${
                size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
              }`}
            >
              {value ? (
                <span
                  className={`rounded-full ${
                    size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
                  }`}
                >
                  {renderEmoji(Array.isArray(value) ? value[value.length - 1] : value)}
                </span>
              ) : (
                <Icon iconName="add_reaction" className="text-custom-text-100 scale-125" />
              )}
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
              className={`absolute left-1 z-10 ${
                position === "top" ? "top-0 -translate-y-full" : "bottom-0 translate-y-full"
              }`}
            >
              <div className="bg-custom-background-80 border rounded-md p-4 py-2">
                <div className="flex gap-x-3">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        if (multiple) {
                          onSelect([...(value || []).filter((e) => e !== emoji), emoji]);
                        } else onSelect(emoji);
                        closePopover();
                      }}
                      className="flex h-5 w-5 select-none items-center justify-between text-sm"
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
