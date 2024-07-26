import React, { Fragment } from "react";
// components
import { Popover } from "./popover";
// helpers
import { cn } from "../../helpers";
// types
import { TPopoverMenu } from "./types";

export const PopoverMenu = <T,>(props: TPopoverMenu<T>) => {
  const {
    popperPosition = "bottom-end",
    popperPadding = 0,
    buttonClassName = "",
    button,
    disabled,
    panelClassName = "",
    data,
    popoverClassName = "",
    keyExtractor,
    render,
    popoverButtonRef,
  } = props;

  return (
    <Popover
      popperPosition={popperPosition}
      popperPadding={popperPadding}
      buttonClassName={buttonClassName}
      button={button}
      disabled={disabled}
      panelClassName={cn(
        "my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2 text-xs shadow-custom-shadow-rg focus:outline-none",
        panelClassName
      )}
      popoverClassName={popoverClassName}
      popoverButtonRef={popoverButtonRef}
    >
      <Fragment>
        {data.map((item, index) => (
          <Fragment key={keyExtractor(item, index)}>{render(item, index)}</Fragment>
        ))}
      </Fragment>
    </Popover>
  );
};
