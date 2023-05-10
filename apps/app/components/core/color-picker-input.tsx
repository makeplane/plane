import React from "react";

// react-form
import {
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
// react-color
import { ColorResult, SketchPicker } from "react-color";
// component
import { Popover, Transition } from "@headlessui/react";
import { Input } from "components/ui";
// icons
import { ColorPickerIcon } from "components/icons";

type Props = {
  name: string;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
  register: UseFormRegister<any>;
};

export const ColorPickerInput: React.FC<Props> = ({ name, watch, setValue, error, register }) => {
  const handleColorChange = (newColor: ColorResult) => {
    const { hex } = newColor;
    setValue(name, hex);
  };

  const getColorText = (colorName: string) => {
    switch (colorName) {
      case "accent":
        return "Accent";
      case "bgBase":
        return "Background";
      case "bgSurface1":
        return "Background surface 1";
      case "bgSurface2":
        return "Background surface 2";
      case "border":
        return "Border";
      case "sidebar":
        return "Sidebar";
      case "textBase":
        return "Text primary";
      case "textSecondary":
        return "Text secondary";
      default:
        return "Color";
    }
  };

  return (
    <div className="relative ">
      <Input
        id={name}
        name={name}
        type="name"
        placeholder="#FFFFFF"
        autoComplete="off"
        error={error}
        value={watch(name)}
        register={register}
        validations={{
          required: `${getColorText(name)} color is required`,
          pattern: {
            value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
            message: `${getColorText(name)} color should be hex format`,
          },
        }}
      />
      <div className="absolute right-4 top-2.5">
        <Popover className="relative grid place-items-center">
          {({ open }) => (
            <>
              <Popover.Button
                type="button"
                className={`group inline-flex items-center outline-none ${
                  open ? "text-brand-base" : "text-brand-secondary"
                }`}
              >
                {watch(name) && watch(name) !== "" ? (
                  <span
                    className="h-4 w-4 rounded border border-brand-base"
                    style={{
                      backgroundColor: `${watch(name)}`,
                    }}
                  />
                ) : (
                  <ColorPickerIcon
                    height={14}
                    width={14}
                    className="fill-current text-brand-base"
                  />
                )}
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
                <Popover.Panel className="absolute bottom-8 right-0 z-20 mt-1 max-w-xs px-2 sm:px-0">
                  <SketchPicker color={watch(name)} onChange={handleColorChange} />
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
};
