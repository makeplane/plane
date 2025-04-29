"use client";

import { FC } from "react";
// types
import { TSvgIcons } from "./types";

export const CompletedIcon: FC<TSvgIcons> = (props) => {
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
          d="M3.8 1C2.2536 1 1 2.2536 1 3.8V12.2C1 13.7464 2.2536 15 3.8 15H12.2C13.7464 15 15 13.7464 15 12.2V3.8C15 2.2536 13.7464 1 12.2 1H3.8ZM12.0416 5.77968C12.3127 5.41768 12.2272 4.91292 11.8508 4.65228C11.4743 4.39164 10.9493 4.47381 10.6783 4.83581L7.20148 9.47894L5.2107 7.70652C4.87029 7.40346 4.33883 7.42311 4.02364 7.75042C3.70846 8.07773 3.7289 8.58875 4.0693 8.89182L6.75728 11.285C6.93391 11.4422 7.17223 11.5191 7.41176 11.496C7.65129 11.4729 7.869 11.3521 8.00966 11.1642L12.0416 5.77968Z"
          fill={color}
        />
      </svg>
    </>
  );
};
