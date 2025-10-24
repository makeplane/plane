import * as React from "react";

import { ISvgIcons } from "./type";

interface IIconWrapper extends ISvgIcons {
  children: React.ReactNode;
  clipPathId?: string;
  viewBox?: string;
}

export const IconWrapper: React.FC<IIconWrapper> = ({
  width = "16",
  height = "16",
  className = "text-current",
  children,
  clipPathId,
  viewBox = "0 0 16 16",
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...rest}
  >
    {clipPathId ? (
      <>
        <g clipPath={`url(#${clipPathId})`}>{children}</g>
        <defs>
          <clipPath id={clipPathId}>
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </>
    ) : (
      children
    )}
  </svg>
);
