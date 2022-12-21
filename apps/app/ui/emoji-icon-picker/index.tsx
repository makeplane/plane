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
    if (!value) onChange(getRandomEmoji());
  }, [value, onChange]);

  return (
    <Popover className="relative" ref={ref}>
      <Popover.Button
        className="border border-gray-300 p-3 sm:text-sm rounded-md outline-none"
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
        <Popover.Panel className="absolute z-10 w-80 bg-white rounded-md shadow-lg mt-2">
          <div className="w-80 h-80 p-2 bg-white overflow-auto rounded shadow-2xl border">
            <Tab.Group as="div" className="w-full h-full flex flex-col">
              <Tab.List className="-mx-2 flex justify-around p-1 gap-1 border-b rounded flex-0">
                {tabOptions.map((tab) => (
                  <Tab
                    key={tab.key}
                    className={({ selected }) =>
                      `w-1/2 py-2 transition-colors border-b text-sm font-medium text-center outline-none -my-1 ${
                        selected ? "border-theme" : "border-transparent"
                      }`
                    }
                  >
                    {tab.title}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="w-full h-full flex-1 overflow-y-auto overflow-x-hidden">
                <Tab.Panel className="w-full h-full">
                  {recentEmojis.length > 0 && (
                    <div className="py-2 w-full">
                      <h3 className="text-lg mb-2">Recent Emojis</h3>
                      <div className="grid grid-cols-9 gap-2">
                        {recentEmojis.map((emoji) => (
                          <button
                            type="button"
                            className="select-none text-xl"
                            key={emoji}
                            onClick={() => {
                              onChange(emoji);
                            }}
                          >
                            {String.fromCodePoint(parseInt(emoji))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="py-3">
                    <h3 className="text-lg mb-2">All Emojis</h3>
                    <div className="grid grid-cols-9 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          type="button"
                          className="select-none text-xl"
                          key={emoji}
                          onClick={() => {
                            onChange(emoji);
                            saveRecentEmoji(emoji);
                          }}
                        >
                          {String.fromCodePoint(parseInt(emoji))}
                        </button>
                      ))}
                    </div>
                  </div>
                </Tab.Panel>
                <Tab.Panel className="w-full h-full flex flex-col justify-center items-center">
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
