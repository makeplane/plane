import type { Placement } from "@popperjs/core";

import type { TButtonVariants } from "../types";

export type ReporterDropdownProps = {
  button?: React.ReactNode;
  buttonClassName?: string;
  buttonContainerClassName?: string;
  buttonVariant?: TButtonVariants;
  className?: string;
  disabled?: boolean;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  hideIcon?: boolean;
  multiple?: false;
  onChange: (val: string) => void;
  value: string | null;
  placeholder?: string;
  placement?: Placement;
  showTooltip?: boolean;
  showUserDetails?: boolean;
  tabIndex?: number;
  tooltipContent?: string;
};
