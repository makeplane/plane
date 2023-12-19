import React, { useState } from "react";
// react-popper
import { usePopper } from "react-popper";
// emoji-picker-react
import EmojiPicker, { Theme } from "emoji-picker-react";
// headless ui
import { Popover } from "@headlessui/react";

export interface ICustomEmojiPicker {
  label: React.ReactNode;
  onChange: (emoji: string) => void;
  height?: number | string;
  width?: number | string;
  theme?: Theme;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export const CustomEmojiPicker: React.FC<ICustomEmojiPicker> = (props) => {
  const {
    label,
    onChange,
    height = 320,
    width = 300,
    theme,
    searchPlaceholder = "Search...",
    disabled = false,
  } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

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

  const handleOnChange = (emoji: any) => {
    onChange(emoji.unified);
  };

  return (
    <Popover as="div" className="relative">
      {({ open }) => (
        <>
          <Popover.Button as={React.Fragment}>
            <button type="button" ref={setReferenceElement} className="outline-none" disabled={disabled}>
              {label}
            </button>
          </Popover.Button>
          {open && (
            <Popover.Panel className="fixed z-10">
              <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
                <EmojiPicker
                  onEmojiClick={handleOnChange}
                  height={height}
                  width={width}
                  theme={theme}
                  searchPlaceholder={searchPlaceholder}
                  previewConfig={{
                    showPreview: false,
                  }}
                />
              </div>
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  );
};
