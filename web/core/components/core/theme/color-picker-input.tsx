"use client";
import { FC, Fragment } from "react";
// react-form
import { ColorResult, SketchPicker } from "react-color";
import {
  Control,
  Controller,
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
// react-color
// component
import { Palette } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { IUserTheme } from "@plane/types";
import { Input } from "@plane/ui";
// icons
// types

type Props = {
  name: keyof IUserTheme;
  position?: "left" | "right";
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  control: Control<IUserTheme, any>;
  error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
  register: UseFormRegister<any>;
};

export const ColorPickerInput: FC<Props> = (props) => {
  const { name, position = "left", watch, setValue, error, control } = props;

  const handleColorChange = (newColor: ColorResult) => {
    const { hex } = newColor;
    setValue(name, hex);
  };

  const getColorText = (colorName: keyof IUserTheme) => {
    switch (colorName) {
      case "background":
        return "Background";
      case "text":
        return "Text";
      case "primary":
        return "Primary(Theme)";
      case "sidebarBackground":
        return "Sidebar Background";
      case "sidebarText":
        return "Sidebar Text";
      default:
        return "Color";
    }
  };

  return (
    <div className="relative">
      <Controller
        control={control}
        name={name}
        rules={{
          required: `${getColorText(name)} color is required`,
          pattern: {
            value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
            message: `${getColorText(name)} color should be hex format`,
          },
        }}
        render={({ field: { onChange, ref } }) => (
          <Input
            id={name}
            name={name}
            type="text"
            value={watch("name")}
            onChange={onChange}
            ref={ref}
            hasError={Boolean(error)}
            placeholder="#FFFFFF"
          />
        )}
      />
      <div className="absolute right-4 top-2.5">
        <Popover className="relative grid place-items-center">
          {({ open }) => (
            <>
              <Popover.Button
                type="button"
                className={`group inline-flex items-center outline-none ${
                  open ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                {watch(name) && watch(name) !== "" ? (
                  <span
                    className="h-4 w-4 rounded border border-custom-border-200"
                    style={{
                      backgroundColor: `${watch(name)}`,
                    }}
                  />
                ) : (
                  <Palette className="h-3.5 w-3.5 text-custom-text-100" />
                )}
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
                  className={`absolute bottom-8 z-20 mt-1 max-w-xs px-2 sm:px-0 ${
                    position === "right" ? "left-0" : "right-0"
                  }`}
                >
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
