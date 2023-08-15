import React from "react";

import type { Props } from "./types";

export const ContrastIcon: React.FC<Props> = ({
  width = "24",
  height = "24",
  color = "rgb(var(--color-text-200))",
  className,
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="9" r="5.4375" stroke={color} strokeLinecap="round" />
    <path
      fill={color}
      d="M9 5.81247C9 5.39825 9.33876 5.05526 9.74548 5.13368C10.0057 5.18385 10.2608 5.26029 10.5068 5.36219C10.9845 5.56007 11.4186 5.8501 11.7842 6.21574C12.1499 6.58137 12.4399 7.01543 12.6378 7.49315C12.8357 7.97087 12.9375 8.48289 12.9375 8.99997C12.9375 9.51705 12.8357 10.0291 12.6378 10.5068C12.4399 10.9845 12.1499 11.4186 11.7842 11.7842C11.4186 12.1498 10.9845 12.4399 10.5068 12.6377C10.2608 12.7396 10.0057 12.8161 9.74548 12.8663C9.33876 12.9447 9 12.6017 9 12.1875L9 5.81247Z"
    />
  </svg>
);
