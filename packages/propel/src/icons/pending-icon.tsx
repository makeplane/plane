import * as React from "react";

import type { ISvgIcons } from "./type";

export function PendingState({ width = "10", height = "11", className, color = "#455068" }: ISvgIcons) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 5C12.5523 5 13 5.44772 13 6V11.382L16.4472 13.1056C16.9412 13.3526 17.1414 13.9532 16.8944 14.4472C16.6474 14.9412 16.0468 15.1414 15.5528 14.8944L11.5528 12.8944C11.214 12.725 11 12.3788 11 12V6C11 5.44772 11.4477 5 12 5Z"
        fill={color}
      />
    </svg>
  );
}
