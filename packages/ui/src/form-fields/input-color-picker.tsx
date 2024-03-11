import * as React from "react";
import { Popover, Transition } from "@headlessui/react";
import { ColorResult, SketchPicker } from "react-color";
// components
import { Input } from "./input";
import { usePopper } from "react-popper";
import { Button } from "../button";

export interface InputColorPickerProps {
  hasError: boolean;
  value: string | undefined;
  onChange: (value: string) => void;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder: string;
}

export const InputColorPicker: React.FC<InputColorPickerProps> = (props) => {
  const { value, hasError, onChange, name, className, style, placeholder } = props;

  const [referenceElement, setReferenceElement] = React.useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
  });

  const handleColorChange = (newColor: ColorResult) => {
    const { hex } = newColor;
    onChange(hex);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <Input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={handleInputChange}
        hasError={hasError}
        placeholder={placeholder}
        className={`border-[0.5px] border-custom-border-200 ${className}`}
        style={style}
      />

      <Popover as="div" className="absolute right-1 top-1/2 z-10 -translate-y-1/2">
        {({ open }) => {
          if (open) {
          }
          return (
            <>
              <Popover.Button as={React.Fragment}>
                <Button
                  ref={setReferenceElement}
                  variant="neutral-primary"
                  size="sm"
                  className="border-none !bg-transparent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-palette"
                  >
                    <circle cx="13.5" cy="6.5" r=".5" />
                    <circle cx="17.5" cy="10.5" r=".5" />
                    <circle cx="8.5" cy="7.5" r=".5" />
                    <circle cx="6.5" cy="12.5" r=".5" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                  </svg>
                </Button>
              </Popover.Button>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel>
                  <div
                    className="z-10 overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    <SketchPicker color={value} onChange={handleColorChange} />
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          );
        }}
      </Popover>
    </div>
  );
};
