"use client";

import { FC } from "react";
// types
import { TSvgIcons } from "./types";

export const MonitoringIcon: FC<TSvgIcons> = (props) => {
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
          d="M3.8 2.4H12.2C12.9732 2.4 13.6 3.0268 13.6 3.8V12.2C13.6 12.9732 12.9732 13.6 12.2 13.6H3.8C3.0268 13.6 2.4 12.9732 2.4 12.2V3.8C2.4 3.0268 3.0268 2.4 3.8 2.4ZM1 3.8C1 2.2536 2.2536 1 3.8 1H12.2C13.7464 1 15 2.2536 15 3.8V12.2C15 13.7464 13.7464 15 12.2 15H3.8C2.2536 15 1 13.7464 1 12.2V3.8ZM5.2 3.8C4.4268 3.8 3.8 4.4268 3.8 5.2V10.8C3.8 11.5732 4.4268 12.2 5.2 12.2H10.8C11.5732 12.2 12.2 11.5732 12.2 10.8V5.2C12.2 4.4268 11.5732 3.8 10.8 3.8H5.2Z"
          fill={color}
        />
      </svg>
    </>
  );
};
