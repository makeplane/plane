import React, { Fragment } from "react";
// headless ui
import { Combobox } from "@headlessui/react";
// helper
import { cn } from "../../../helpers";
import { IMultiSelectDropdownButton, ISingleSelectDropdownButton } from "../dropdown";

export const DropdownButton: React.FC<IMultiSelectDropdownButton | ISingleSelectDropdownButton> = (props) => {
  const {
    isOpen,
    buttonContent,
    buttonClassName,
    buttonContainerClassName,
    handleOnClick,
    value,
    setReferenceElement,
    disabled,
  } = props;
  return (
    <Combobox.Button as={Fragment}>
      <button
        ref={setReferenceElement}
        type="button"
        className={cn(
          "clickable block h-full max-w-full outline-none",
          {
            "cursor-not-allowed text-custom-text-200": disabled,
            "cursor-pointer": !disabled,
          },
          buttonContainerClassName
        )}
        onClick={handleOnClick}
      >
        {buttonContent ? <>{buttonContent(isOpen, value)}</> : <span className={cn("", buttonClassName)}>{value}</span>}
      </button>
    </Combobox.Button>
  );
};
