import { Combobox } from "@headlessui/react";
import React, { Fragment } from "react";
// helper
import { cn } from "../../utils";
import type { IMultiSelectDropdownButton, ISingleSelectDropdownButton } from "../dropdown";

export function DropdownButton(props: IMultiSelectDropdownButton | ISingleSelectDropdownButton) {
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
            "cursor-not-allowed text-secondary": disabled,
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
}
