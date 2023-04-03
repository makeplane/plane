import React, { useEffect, useState, useRef } from "react";
// headless ui
import { Tab, Transition, Popover } from "@headlessui/react";
// react colors
import { TwitterPicker } from "react-color";
// types
import { Props } from "./types";
// emojis
import emojis from "./emojis.json";
import icons from "./icons.json";
// helpers
import { getRecentEmojis, saveRecentEmoji } from "./helpers";
import { getRandomEmoji } from "helpers/common.helper";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";

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

const EmojiIconPicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  onIconColorChange,
  onIconsClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState<string>("#020617");

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
    <Popover className="relative z-[1]" ref={ref}>
      <Popover.Button
        className="rounded-full bg-gray-100 p-2 outline-none sm:text-sm"
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
        <Popover.Panel className="absolute z-10 mt-2 w-80 rounded-lg bg-white shadow-lg">
          <div className="h-72 w-80 overflow-auto rounded border bg-white p-2 shadow-2xl">
            <Tab.Group as="div" className="flex h-full w-full flex-col">
              <Tab.List className="flex-0 -mx-2 flex justify-around gap-1 border-b p-1">
                {tabOptions.map((tab) => (
                  <Tab key={tab.key} as={React.Fragment}>
                    {({ selected }) => (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenColorPicker(false);
                        }}
                        className={`-my-1 w-1/2 border-b py-2 text-center text-sm font-medium outline-none transition-colors ${
                          selected ? "border-theme" : "border-transparent"
                        }`}
                      >
                        {tab.title}
                      </button>
                    )}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="flex-1 overflow-y-auto">
                <Tab.Panel>
                  {recentEmojis.length > 0 && (
                    <div className="py-2">
                      <h3 className="mb-2">Recent Emojis</h3>
                      <div className="grid grid-cols-9 gap-2">
                        {recentEmojis.map((emoji) => (
                          <button
                            type="button"
                            className="select-none text-lg hover:bg-hover-gray"
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
                  <div>
                    <h3 className="mb-2">All Emojis</h3>
                    <div className="grid grid-cols-9 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          type="button"
                          className="select-none text-lg hover:bg-hover-gray"
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
                <div className="py-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenColorPicker((prev) => !prev)}
                      className="mb-2 flex items-center gap-2"
                    >
                      <span>Select Color</span>
                      <span className="w-7 h-7" style={{ backgroundColor: activeColor }} />
                    </button>
                    <div>
                      <TwitterPicker
                        className={`m-2 !absolute top-5 z-10 ${
                          openColorPicker ? "block" : "hidden"
                        }`}
                        color={activeColor}
                        onChange={(color) => {
                          setActiveColor(color.hex);
                          if (onIconColorChange) onIconColorChange(color.hex);
                        }}
                      />
                    </div>
                  </div>
                  <Tab.Panel className="flex h-full w-full flex-col justify-center">
                    <h3 className="mb-2">Rounded Icons</h3>
                    <div className="grid grid-cols-9 gap-2">
                      {icons.material_rounded.map((icon) => (
                        <button
                          type="button"
                          className="select-none text-lg hover:bg-hover-gray"
                          key={icon.name}
                          onClick={() => {
                            if (onIconsClick) onIconsClick(icon.name);
                            setIsOpen(false);
                          }}
                        >
                          <span style={{ color: activeColor }} className="material-symbols-rounded">
                            {icon.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Tab.Panel>
                </div>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default EmojiIconPicker;
