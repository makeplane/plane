import React, { Fragment, PropsWithChildren } from "react";
// helpers
import { Popover } from "./popover";
// types
import { TPopoverMenu } from "./types";

export const PopoverMenu = <T,>(props: PropsWithChildren<TPopoverMenu<T>>) => {
  const {
    popperPosition = "bottom-end",
    popperPadding = 0,
    buttonClassName = "",
    button,
    panelClassName = "",
    data,
    keyExtractor,
    render,
  } = props;

  return (
    <Popover
      popperPosition={popperPosition}
      popperPadding={popperPadding}
      buttonClassName={buttonClassName}
      button={button}
      panelClassName={panelClassName}
    >
      <Fragment>
        {data.map((item, index) => (
          <Fragment key={keyExtractor(item, index)}>{render(item, index)}</Fragment>
        ))}
      </Fragment>
    </Popover>
  );
};
