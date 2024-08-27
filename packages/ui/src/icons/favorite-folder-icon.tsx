import * as React from "react";

import { ISvgIcons } from "./type";

export const FavoriteFolderIcon: React.FC<ISvgIcons> = ({ className = "text-current", color = "#a3a3a3", ...rest }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke={color}
    className={`${className} stroke-2`}
    {...rest}
  >
    <path
      d="M7.33325 13.3334H2.66659C2.31296 13.3334 1.97382 13.1929 1.72378 12.9429C1.47373 12.6928 1.33325 12.3537 1.33325 12.0001V3.3334C1.33325 2.97978 1.47373 2.64064 1.72378 2.39059C1.97382 2.14054 2.31296 2.00006 2.66659 2.00006H5.26659C5.48958 1.99788 5.70955 2.05166 5.90638 2.15648C6.10322 2.2613 6.27061 2.41381 6.39325 2.60006L6.93325 3.40006C7.05466 3.58442 7.21994 3.73574 7.41425 3.84047C7.60857 3.94519 7.82585 4.00003 8.04658 4.00006H13.3333C13.6869 4.00006 14.026 4.14054 14.2761 4.39059C14.5261 4.64064 14.6666 4.97978 14.6666 5.3334V6.3334"
      // stroke="#60646C"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12.1373 8L13.0038 9.75535L14.9414 10.0386L13.5394 11.4041L13.8702 13.3333L12.1373 12.422L10.4044 13.3333L10.7353 11.4041L9.33325 10.0386L11.2709 9.75535L12.1373 8Z"
      stroke-width="1.25"
      // stroke="#60646C"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
);
