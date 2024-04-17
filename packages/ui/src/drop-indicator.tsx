import React from "react";
import { cn } from "../helpers";

type Props = {
  isVisible: boolean;
  classNames?: string;
};

export const DropIndicator = (props: Props) => {
  const { isVisible, classNames = "" } = props;

  return (
    <div
      className={cn(
        `block relative h-[2px] w-full
    before:left-0 before:relative before:block before:top-[-2px] before:h-[6px] before:w-[6px] before:rounded
    after:left-[calc(100%-6px)] after:relative after:block after:top-[-8px] after:h-[6px] after:w-[6px] after:rounded`,
        {
          "bg-custom-primary-100 before:bg-custom-primary-100 after:bg-custom-primary-100": isVisible,
        },
        classNames
      )}
    />
  );
};
