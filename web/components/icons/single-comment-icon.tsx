import React from "react";

import type { Props } from "./types";

export const SingleCommentCard: React.FC<Props> = ({ width = "24", height = "24", className, color }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.66663 20.3346V4.91797C3.66663 4.58464 3.79163 4.29297 4.04163 4.04297C4.29163 3.79297 4.58329 3.66797 4.91663 3.66797H19.0833C19.4166 3.66797 19.7083 3.79297 19.9583 4.04297C20.2083 4.29297 20.3333 4.58464 20.3333 4.91797V15.7513C20.3333 16.0846 20.2083 16.3763 19.9583 16.6263C19.7083 16.8763 19.4166 17.0013 19.0833 17.0013H6.99996L3.66663 20.3346ZM6.45829 15.7513H19.0833V4.91797H4.91663V17.418L6.45829 15.7513Z"
      fill={color ? color : "currentColor"}
    />
  </svg>
);
