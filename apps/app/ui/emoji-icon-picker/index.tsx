import React, { useEffect, useState, useRef } from "react";
// headless ui
import { Tab, Transition, Popover } from "@headlessui/react";
// hooks
import useOutsideClickDetector from "lib/hooks/useOutsideClickDetector";
// common
import { getRandomEmoji } from "constants/common";
// emoji
import emojis from "./emojis.json";
// helpers
import { getRecentEmojis, saveRecentEmoji } from "./helpers";
// types
import { Props } from "./types";

const tabOptions = [
  {
    key: "emoji",
    title: "Emoji",
  },
  {
    key: "icon",
    title: "Icon",
  },
];

const EmojiIconPicker: React.FC<Props> = ({ label, value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  useEffect(() => {
    setRecentEmojis(getRecentEmojis());
  }, []);

  useOutsideClickDetector(ref, () => {
    setIsOpen(false);
  });

  useEffect(() => {
    if (!value || value?.length === 0) onChange(getRandomEmoji());
  }, [value, onChange]);

  return (
    <Popover className="relative" ref={ref}>
      <Popover.Button
        className="rounded-md border border-gray-300 p-2 outline-none sm:text-sm"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {label}
      </Popover.Button>
      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Popover.Panel className="absolute z-10 mt-2 w-80 rounded-md bg-white shadow-lg">
          <div className="h-80 w-80 overflow-auto rounded border bg-white p-2 shadow-2xl">
            <Tab.Group as="div" className="flex h-full w-full flex-col">
              <Tab.List className="flex-0 -mx-2 flex justify-around gap-1 rounded border-b p-1">
                {tabOptions.map((tab) => (
                  <Tab
                    key={tab.key}
                    className={({ selected }) =>
                      `-my-1 w-1/2 border-b py-2 text-center text-sm font-medium outline-none transition-colors ${
                        selected ? "border-theme" : "border-transparent"
                      }`
                    }
                  >
                    {tab.title}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="h-full w-full flex-1 overflow-y-auto overflow-x-hidden">
                <Tab.Panel className="h-full w-full">
                  {recentEmojis.length > 0 && (
                    <div className="w-full py-2">
                      <h3 className="mb-2 text-lg">Recent Emojis</h3>
                      <div className="grid grid-cols-9 gap-2">
                        {recentEmojis.map((emoji) => (
                          <button
                            type="button"
                            className="select-none text-xl"
                            key={emoji}
                            onClick={() => {
                              onChange(emoji);
                              setIsOpen(false);
                            }}
                          >
                            {String.fromCodePoint(parseInt(emoji))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="py-3">
                    <h3 className="mb-2 text-lg">All Emojis</h3>
                    <div className="grid grid-cols-9 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          type="button"
                          className="select-none text-xl"
                          key={emoji}
                          onClick={() => {
                            onChange(emoji);
                            saveRecentEmoji(emoji);
                            setIsOpen(false);
                          }}
                        >
                          {String.fromCodePoint(parseInt(emoji))}
                        </button>
                      ))}
                    </div>
                  </div>
                </Tab.Panel>
                <Tab.Panel className="flex h-full w-full flex-col items-center justify-center">
                  <p>Coming Soon...</p>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default EmojiIconPicker;
