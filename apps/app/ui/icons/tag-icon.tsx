import React from "react";

import type { Props } from "./types";

export const TagIcon: React.FC<Props> = ({
  width = "24",
  height = "24",
  className,
  color = "black",
}) => {
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.975 21.575C13.675 21.875 13.3125 22.025 12.8875 22.025C12.4625 22.025 12.1 21.875 11.8 21.575L2.425 12.2C2.25833 12.0333 2.14583 11.8583 2.0875 11.675C2.02917 11.4917 2 11.3 2 11.1V3.5C2 3.06667 2.14167 2.70833 2.425 2.425C2.70833 2.14167 3.06667 2 3.5 2H11.1C11.3 2 11.5 2.02917 11.7 2.0875C11.9 2.14583 12.0833 2.25833 12.25 2.425L21.575 11.75C21.8917 12.0667 22.05 12.4375 22.05 12.8625C22.05 13.2875 21.8917 13.6583 21.575 13.975L13.975 21.575ZM12.95 20.55L20.55 12.95L11.1 3.5H3.5V11.1L12.95 20.55ZM6.125 7.4C6.475 7.4 6.77917 7.27083 7.0375 7.0125C7.29583 6.75417 7.425 6.45 7.425 6.1C7.425 5.75 7.29583 5.44583 7.0375 5.1875C6.77917 4.92917 6.475 4.8 6.125 4.8C5.775 4.8 5.47083 4.92917 5.2125 5.1875C4.95417 5.44583 4.825 5.75 4.825 6.1C4.825 6.45 4.95417 6.75417 5.2125 7.0125C5.47083 7.27083 5.775 7.4 6.125 7.4Z"
        fill={color}
      />
    </svg>
  );
};
