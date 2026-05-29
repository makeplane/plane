import * as React from "react";

import type { ISvgIcons } from "./type";

export function DiceIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} stroke-2`}
      stroke="currentColor"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.77778 7H7.22222C7.09949 7 7 7.09949 7 7.22222V8.77778C7 8.90051 7.09949 9 7.22222 9H8.77778C8.90051 9 9 8.90051 9 8.77778V7.22222C9 7.09949 8.90051 7 8.77778 7Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.77778 15H7.22222C7.09949 15 7 15.0995 7 15.2222V16.7778C7 16.9005 7.09949 17 7.22222 17H8.77778C8.90051 17 9 16.9005 9 16.7778V15.2222C9 15.0995 8.90051 15 8.77778 15Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.7778 7H15.2222C15.0995 7 15 7.09949 15 7.22222V8.77778C15 8.90051 15.0995 9 15.2222 9H16.7778C16.9005 9 17 8.90051 17 8.77778V7.22222C17 7.09949 16.9005 7 16.7778 7Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.7778 15H15.2222C15.0995 15 15 15.0995 15 15.2222V16.7778C15 16.9005 15.0995 17 15.2222 17H16.7778C16.9005 17 17 16.9005 17 16.7778V15.2222C17 15.0995 16.9005 15 16.7778 15Z"
        fill="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
