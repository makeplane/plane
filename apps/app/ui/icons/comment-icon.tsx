import React from "react";

import type { Props } from "./types";

export const CommentIcon: React.FC<Props> = ({ width = "24", height = "24", className }) => {
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 16.1V3.05C2 2.81667 2.10833 2.58333 2.325 2.35C2.54167 2.11667 2.76667 2 3 2H15.975C16.225 2 16.4583 2.1125 16.675 2.3375C16.8917 2.5625 17 2.8 17 3.05V11.95C17 12.1833 16.8917 12.4167 16.675 12.65C16.4583 12.8833 16.225 13 15.975 13H6L2.65 16.35C2.53333 16.4667 2.39583 16.4958 2.2375 16.4375C2.07917 16.3792 2 16.2667 2 16.1ZM3.5 3.5V11.5V3.5ZM7.025 18C6.79167 18 6.5625 17.8833 6.3375 17.65C6.1125 17.4167 6 17.1833 6 16.95V14.5H18.5V6H21C21.2333 6 21.4583 6.11667 21.675 6.35C21.8917 6.58333 22 6.825 22 7.075V21.075C22 21.2417 21.9208 21.3542 21.7625 21.4125C21.6042 21.4708 21.4667 21.4417 21.35 21.325L18.025 18H7.025ZM15.5 3.5H3.5V11.5H15.5V3.5Z" />
    </svg>
  );
};
