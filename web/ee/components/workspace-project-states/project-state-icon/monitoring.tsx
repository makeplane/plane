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
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.0003 1.66699H4.00033C2.71166 1.66699 1.66699 2.71166 1.66699 4.00033V14.0003C1.66699 15.289 2.71166 16.3337 4.00033 16.3337H14.0003C15.289 16.3337 16.3337 15.289 16.3337 14.0003V4.00033C16.3337 2.71166 15.289 1.66699 14.0003 1.66699ZM4.00033 0.666992C2.15938 0.666992 0.666992 2.15938 0.666992 4.00033V14.0003C0.666992 15.8413 2.15938 17.3337 4.00033 17.3337H14.0003C15.8413 17.3337 17.3337 15.8413 17.3337 14.0003V4.00033C17.3337 2.15938 15.8413 0.666992 14.0003 0.666992H4.00033Z"
          fill={color}
        />
      </svg>
    </>
  );
};
