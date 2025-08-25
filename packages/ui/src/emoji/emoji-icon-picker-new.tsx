import { Popover, Tab } from "@headlessui/react";
import React, { useRef, useState } from "react";
import { usePopper } from "react-popper";
import { useOutsideClickDetector } from "@plane/hooks";
import { cn } from "../utils";
import { EmojiIconPickerTypes, TABS_LIST, TCustomEmojiPicker, emojiToString } from "./emoji-icon-helper";
import { LucideIconsList } from "./lucide-icons-list";
import { EmojiPickerComponent } from "./emoji-picker";

export const EmojiIconPicker: React.FC<TCustomEmojiPicker> = (props) => {
  const {
    isOpen,
    handleToggle,
    buttonClassName,
    className,
    closeOnSelect = true,
    defaultIconColor = "#6d7b8a",
    defaultOpen = EmojiIconPickerTypes.EMOJI,
    disabled = false,
    dropdownClassName,
    label,
    onChange,
    placement = "bottom-start",
    searchDisabled = false,
    searchPlaceholder = "Search",
    theme,
  } = props;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 20,
        },
      },
    ],
  });

  // close dropdown on outside click
  useOutsideClickDetector(containerRef, () => handleToggle(false));

  return (
    <Popover as="div" className={cn("relative", className)}>
      <>
        <Popover.Button as={React.Fragment}>
          <button
            type="button"
            ref={setReferenceElement}
            className={cn("outline-none", buttonClassName)}
            disabled={disabled}
            onClick={() => handleToggle(!isOpen)}
          >
            {label}
          </button>
        </Popover.Button>
        {isOpen && (
          <Popover.Panel className="fixed z-10" static>
            <div
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className={cn(
                "w-80 bg-custom-background-100 rounded-md border-[0.5px] border-custom-border-300 overflow-hidden",
                dropdownClassName
              )}
            >
              <Tab.Group
                ref={containerRef}
                as="div"
                className="h-full w-full flex flex-col overflow-hidden"
                defaultIndex={TABS_LIST.findIndex((tab) => tab.key === defaultOpen)}
              >
                <Tab.List as="div" className="grid grid-cols-2 gap-1 p-2">
                  {TABS_LIST.map((tab) => (
                    <Tab
                      key={tab.key}
                      className={({ selected }) =>
                        cn("py-1 text-sm rounded border border-custom-border-200", {
                          "bg-custom-background-80": selected,
                          "hover:bg-custom-background-90 focus:bg-custom-background-90": !selected,
                        })
                      }
                    >
                      {tab.title}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels as="div" className="h-80 w-full overflow-hidden overflow-y-auto">
                  <Tab.Panel>
                    <EmojiPickerComponent
                      onEmojiSelect={(val) => {
                        console.log(val);
                        onChange({
                          type: EmojiIconPickerTypes.EMOJI,
                          value: emojiToString(val.emoji),
                        });
                        if (closeOnSelect) handleToggle(false);
                      }}
                      className="h-full w-full border-none p-2"
                    >
                      {/* data-slot="emoji-picker-search-wrapper" */}
                      <div className="flex items-center gap-2 justify-between [&>[data-slot='emoji-picker-search-wrapper']]:flex-grow [&>[data-slot='emoji-picker-search-wrapper']]:p-0 px-1.5 py-2 sticky top-0 z-10 bg-custom-background-100">
                        <EmojiPickerComponent.Search
                          placeholder={searchPlaceholder}
                          disabled={searchDisabled}
                          className="flex-grow"
                        />
                        <EmojiPickerComponent.SkinToneSelector className="flex-shrink-0" />
                      </div>
                      <EmojiPickerComponent.Content>
                        <EmojiPickerComponent.Loading />
                        <EmojiPickerComponent.Empty />
                        <EmojiPickerComponent.List />
                      </EmojiPickerComponent.Content>
                    </EmojiPickerComponent>
                  </Tab.Panel>
                  <Tab.Panel className="h-80 w-full relative overflow-hidden overflow-y-auto">
                    <LucideIconsList
                      defaultColor={defaultIconColor}
                      onChange={(val) => {
                        onChange({
                          type: EmojiIconPickerTypes.ICON,
                          value: val,
                        });
                        if (closeOnSelect) handleToggle(false);
                      }}
                      searchDisabled={searchDisabled}
                    />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </Popover.Panel>
        )}
      </>
    </Popover>
  );
};
