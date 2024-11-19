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
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M0.666992 11.5003V14.0003C0.666992 15.8413 2.15938 17.3337 4.00033 17.3337H6.50033V16.3337H4.00033C2.71166 16.3337 1.66699 15.289 1.66699 14.0003V11.5003H0.666992ZM0.666992 6.50033H1.66699V4.00033C1.66699 2.71166 2.71166 1.66699 4.00033 1.66699H6.50033V0.666992H4.00033C2.15938 0.666992 0.666992 2.15938 0.666992 4.00033V6.50033ZM11.5003 0.666992V1.66699H14.0003C15.289 1.66699 16.3337 2.71166 16.3337 4.00033V6.50033H17.3337V4.00033C17.3337 2.15938 15.8413 0.666992 14.0003 0.666992H11.5003ZM17.3337 11.5003H16.3337V14.0003C16.3337 15.289 15.289 16.3337 14.0003 16.3337H11.5003V17.3337H14.0003C15.8413 17.3337 17.3337 15.8413 17.3337 14.0003V11.5003Z"
          // fill="#8B8D98"
          fill={color}
        />
      </svg>
    </>
  );
};
