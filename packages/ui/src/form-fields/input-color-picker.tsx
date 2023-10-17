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
  className: string;
  placeholder: string;
}

export const InputColorPicker: React.FC<InputColorPickerProps> = (props) => {
  const { value, hasError, onChange, name, className, placeholder } = props;

  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] =
    React.useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
  });

  const handleColorChange = (newColor: ColorResult) => {
    const { hex } = newColor;
    onChange(hex);
  };

  const handleInputChange = (value: any) => {
    onChange(value);
  };

  return (
    <div className="flex items-center justify-between rounded border border-custom-border-200 px-1">
      <Input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={handleInputChange}
        hasError={hasError}
        placeholder={placeholder}
        className={`border-none ${className}`}
      />

      <Popover as="div">
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
                  className="border-none !p-1.5"
                >
                  {value && value !== "" ? (
                    <span
                      className="h-3.5 w-3.5 rounded"
                      style={{
                        backgroundColor: `${value}`,
                      }}
                    />
                  ) : (
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 14 14"
                      stroke="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0.8125 13.7508C0.65 13.7508 0.515625 13.6977 0.409375 13.5914C0.303125 13.4852 0.25 13.3508 0.25 13.1883V10.8258C0.25 10.7508 0.2625 10.682 0.2875 10.6195C0.3125 10.557 0.35625 10.4945 0.41875 10.432L7.31875 3.53203L6.34375 2.55703C6.24375 2.45703 6.19688 2.32891 6.20312 2.17266C6.20938 2.01641 6.2625 1.88828 6.3625 1.78828C6.4625 1.68828 6.59063 1.63828 6.74688 1.63828C6.90313 1.63828 7.03125 1.68828 7.13125 1.78828L8.4625 3.13828L11.125 0.475781C11.2625 0.338281 11.4094 0.269531 11.5656 0.269531C11.7219 0.269531 11.8688 0.338281 12.0063 0.475781L13.525 1.99453C13.6625 2.13203 13.7313 2.27891 13.7313 2.43516C13.7313 2.59141 13.6625 2.73828 13.525 2.87578L10.8625 5.53828L12.2125 6.88828C12.3125 6.98828 12.3625 7.11328 12.3625 7.26328C12.3625 7.41328 12.3125 7.53828 12.2125 7.63828C12.1125 7.73828 11.9844 7.78828 11.8281 7.78828C11.6719 7.78828 11.5438 7.73828 11.4438 7.63828L10.4688 6.68203L3.56875 13.582C3.50625 13.6445 3.44375 13.6883 3.38125 13.7133C3.31875 13.7383 3.25 13.7508 3.175 13.7508H0.8125ZM1.375 12.6258H3.00625L9.6625 5.96953L8.03125 4.33828L1.375 10.9945V12.6258ZM10.0563 4.75078L12.3813 2.42578L11.575 1.61953L9.25 3.94453L10.0563 4.75078Z" />
                    </svg>
                  )}
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
