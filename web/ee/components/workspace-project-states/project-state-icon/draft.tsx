"use client";

import { FC } from "react";
// types
import { TSvgIcons } from "./types";

export const DraftIcon: FC<TSvgIcons> = (props) => {
  const { width, height, className, color, ...rest } = props;

  return (
    <>
      <svg
        width={width}
        height={height}
        className={`${className}`}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.8 15C2.2536 15 1 13.7464 1 12.2V9.4C1.7732 9.4 2.4 10.0268 2.4 10.8V12.2C2.4 12.9732 3.0268 13.6 3.8 13.6H5.2C5.9732 13.6 6.6 14.2268 6.6 15H3.8ZM15 9.4C14.2268 9.4 13.6 10.0268 13.6 10.8V12.2C13.6 12.9732 12.9732 13.6 12.2 13.6H10.8C10.0268 13.6 9.4 14.2268 9.4 15H12.2C13.7464 15 15 13.7464 15 12.2V9.4ZM9.4 1C9.4 1.7732 10.0268 2.4 10.8 2.4H12.2C12.9732 2.4 13.6 3.0268 13.6 3.8V5.2C13.6 5.9732 14.2268 6.6 15 6.6V3.8C15 2.2536 13.7464 1 12.2 1H9.4ZM6.6 1C6.6 1.7732 5.9732 2.4 5.2 2.4H3.8C3.0268 2.4 2.4 3.0268 2.4 3.8V5.2C2.4 5.9732 1.7732 6.6 1 6.6V3.8C1 2.2536 2.2536 1 3.8 1H6.6Z"
          fill={color}
        />
      </svg>
    </>
  );
};
