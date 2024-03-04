import React, { useState } from "react";
import { usePopper } from "react-popper";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Popover, Tab } from "@headlessui/react";
// helpers
import { cn } from "../../helpers";
import { materialIcons } from "./icons";

type TChangeHandlerProps =
  | {
      type: "emoji";
      value: EmojiClickData;
    }
  | {
      type: "icon";
      value: {
        name: string;
        color: string;
      };
    };

export type TCustomEmojiPicker = {
  buttonClassName?: string;
  className?: string;
  closeOnSelect?: boolean;
  disabled?: boolean;
  dropdownClassName?: string;
  label: React.ReactNode;
  onChange: (value: TChangeHandlerProps) => void;
  searchPlaceholder?: string;
  theme?: Theme;
};

const TABS_LIST = [
  {
    key: "emoji",
    title: "Emojis",
  },
  {
    key: "icon",
    title: "Icons",
  },
];

export const CustomEmojiPicker: React.FC<TCustomEmojiPicker> = (props) => {
  const {
    buttonClassName,
    className,
    closeOnSelect = true,
    disabled = false,
    dropdownClassName,
    label,
    onChange,
    searchPlaceholder = "Search",
    theme,
  } = props;
  // states
  const [activeColor, setActiveColor] = useState("#000000");
  // refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 20,
        },
      },
    ],
  });

  return (
    <Popover as="div" className={cn("relative", className)}>
      {({ close }) => (
        <>
          <Popover.Button as={React.Fragment}>
            <button
              type="button"
              ref={setReferenceElement}
              className={cn("outline-none", buttonClassName)}
              disabled={disabled}
            >
              {label}
            </button>
          </Popover.Button>
          <Popover.Panel className="fixed z-10">
            <div
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className={cn(
                "h-80 w-80 bg-custom-background-100 rounded-md border-[0.5px] border-custom-border-300 overflow-hidden",
                dropdownClassName
              )}
            >
              <Tab.Group as="div" className="h-full w-full flex flex-col overflow-hidden">
                <Tab.List as="div" className="grid grid-cols-2 gap-1 p-2">
                  {TABS_LIST.map((tab) => (
                    <Tab
                      key={tab.key}
                      className={({ selected }) =>
                        cn(
                          "py-1 text-sm rounded border border-transparent hover:border-custom-border-200 focus:border-custom-border-200",
                          {
                            "bg-custom-background-80 border-custom-border-200": selected,
                          }
                        )
                      }
                    >
                      {tab.title}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels as="div" className="h-full w-full overflow-y-auto">
                  <Tab.Panel>
                    <EmojiPicker
                      onEmojiClick={(val) => {
                        onChange({
                          type: "emoji",
                          value: val,
                        });
                        if (closeOnSelect) close();
                      }}
                      height="100%"
                      width="100%"
                      theme={theme}
                      searchPlaceholder={searchPlaceholder}
                      previewConfig={{
                        showPreview: false,
                      }}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <div className="grid grid-cols-8 gap-2 justify-items-center px-2.5 pb-2 mt-2">
                      {["#FF6B00", "#8CC1FF", "#FCBE1D", "#18904F", "#ADF672", "#05C3FF", "#000000"].map((curCol) => (
                        <span
                          key={curCol}
                          className="h-4 w-4 cursor-pointer rounded-full"
                          style={{ backgroundColor: curCol }}
                          onClick={() => setActiveColor(curCol)}
                        />
                      ))}
                      <button type="button" className="flex items-center gap-1">
                        <span
                          className="conical-gradient h-4 w-4 rounded-full"
                          style={{ backgroundColor: activeColor }}
                        />
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-2 px-2.5 justify-items-center mt-2">
                      {materialIcons.map((icon, index) => (
                        <button
                          key={`${icon.name}-${index}`}
                          type="button"
                          className="h-6 w-6 select-none text-lg grid place-items-center rounded hover:bg-custom-background-80"
                          onClick={() => {
                            onChange({
                              type: "icon",
                              value: {
                                name: icon.name,
                                color: activeColor,
                              },
                            });
                            if (closeOnSelect) close();
                          }}
                        >
                          <span style={{ color: activeColor }} className="material-symbols-rounded text-base">
                            {icon.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};
